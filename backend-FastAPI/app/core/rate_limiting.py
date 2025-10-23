"""
Sistema de Rate Limiting para FastAPI.
"""

import time
from collections import defaultdict, deque
from typing import Dict, Optional
from contextlib import asynccontextmanager

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiter:
    """
    Implementación de rate limiting usando sliding window.
    """
    
    def __init__(self, requests_per_minute: int = 60, window_size: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_size = window_size
        self.requests: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, identifier: str) -> tuple[bool, dict]:
        """
        Verifica si una request está permitida.
        
        Args:
            identifier: Identificador único (IP, user_id, etc.)
            
        Returns:
            Tupla (permitido, headers)
        """
        now = time.time()
        window_start = now - self.window_size
        
        # Limpiar requests antiguas
        user_requests = self.requests[identifier]
        while user_requests and user_requests[0] <= window_start:
            user_requests.popleft()
        
        # Verificar límite
        current_requests = len(user_requests)
        
        headers = {
            "X-RateLimit-Limit": str(self.requests_per_minute),
            "X-RateLimit-Remaining": str(max(0, self.requests_per_minute - current_requests)),
            "X-RateLimit-Reset": str(int(window_start + self.window_size))
        }
        
        if current_requests >= self.requests_per_minute:
            headers["Retry-After"] = str(self.window_size)
            return False, headers
        
        # Agregar request actual
        user_requests.append(now)
        return True, headers


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware para rate limiting automático.
    """
    
    def __init__(
        self,
        app,
        default_requests_per_minute: int = 60,
        authenticated_requests_per_minute: int = 100,
        admin_requests_per_minute: int = 200
    ):
        super().__init__(app)
        self.default_limiter = RateLimiter(default_requests_per_minute)
        self.authenticated_limiter = RateLimiter(authenticated_requests_per_minute)
        self.admin_limiter = RateLimiter(admin_requests_per_minute)
        
        # Endpoints que requieren rate limiting especial
        self.strict_endpoints = {
            "/api/v1/auth/login": RateLimiter(5, 300),  # 5 intentos por 5 minutos
            "/api/v1/auth/register": RateLimiter(3, 300),  # 3 registros por 5 minutos
            "/api/v1/auth/reset-password": RateLimiter(3, 300),  # 3 resets por 5 minutos
        }
    
    async def dispatch(self, request: Request, call_next):
        # Obtener identificador del cliente
        client_ip = self._get_client_ip(request)
        
        # Verificar si es un endpoint con límites especiales
        path = request.url.path
        limiter = self.strict_endpoints.get(path)
        
        if not limiter:
            # Determinar limiter según el usuario
            user = getattr(request.state, 'user', None)
            if user:
                role_id = getattr(user, 'role_id', None)
                if role_id == 1:  # Admin
                    limiter = self.admin_limiter
                else:
                    limiter = self.authenticated_limiter
            else:
                limiter = self.default_limiter
        
        # Verificar rate limit
        identifier = f"{client_ip}:{path}" if limiter in self.strict_endpoints.values() else client_ip
        allowed, headers = limiter.is_allowed(identifier)
        
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded",
                    "message": "Demasiadas solicitudes. Intenta de nuevo más tarde."
                },
                headers=headers
            )
        
        # Continuar con la request
        response = await call_next(request)
        
        # Agregar headers de rate limit a la respuesta
        for key, value in headers.items():
            response.headers[key] = value
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtiene la IP real del cliente considerando proxies."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


def rate_limit(requests_per_minute: int = 60, window_size: int = 60):
    """
    Decorator para aplicar rate limiting a endpoints específicos.
    
    Args:
        requests_per_minute: Número de requests permitidas por minuto
        window_size: Tamaño de la ventana en segundos
    """
    limiter = RateLimiter(requests_per_minute, window_size)
    
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            # Obtener identificador
            client_ip = request.headers.get("X-Forwarded-For", 
                       request.headers.get("X-Real-IP", 
                       request.client.host if request.client else "unknown"))
            
            if "X-Forwarded-For" in request.headers:
                client_ip = client_ip.split(",")[0].strip()
            
            # Verificar rate limit
            allowed, headers = limiter.is_allowed(f"{client_ip}:{request.url.path}")
            
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers=headers
                )
            
            # Continuar con la función
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# Rate limiters específicos para diferentes casos de uso
def strict_rate_limit():
    """Rate limiting estricto para endpoints sensibles (5 req/5min)."""
    return rate_limit(requests_per_minute=5, window_size=300)


def auth_rate_limit():
    """Rate limiting para endpoints de autenticación (10 req/5min)."""
    return rate_limit(requests_per_minute=10, window_size=300)


def api_rate_limit():
    """Rate limiting estándar para API (60 req/min)."""
    return rate_limit(requests_per_minute=60, window_size=60)


# Sistema de rate limiting distribuido (para múltiples instancias)
class RedisRateLimiter:
    """
    Rate limiter usando Redis para aplicaciones distribuidas.
    Requiere instalar redis: pip install redis
    """
    
    def __init__(self, redis_client, requests_per_minute: int = 60, window_size: int = 60):
        self.redis = redis_client
        self.requests_per_minute = requests_per_minute
        self.window_size = window_size
    
    async def is_allowed(self, identifier: str) -> tuple[bool, dict]:
        """
        Verifica rate limit usando Redis.
        """
        now = int(time.time())
        window_start = now - self.window_size
        
        # Usar Redis pipeline para operaciones atómicas
        pipe = self.redis.pipeline()
        
        # Limpiar requests antiguas
        pipe.zremrangebyscore(identifier, 0, window_start)
        
        # Contar requests actuales
        pipe.zcard(identifier)
        
        # Ejecutar operaciones
        results = await pipe.execute()
        current_requests = results[1]
        
        headers = {
            "X-RateLimit-Limit": str(self.requests_per_minute),
            "X-RateLimit-Remaining": str(max(0, self.requests_per_minute - current_requests)),
            "X-RateLimit-Reset": str(window_start + self.window_size)
        }
        
        if current_requests >= self.requests_per_minute:
            headers["Retry-After"] = str(self.window_size)
            return False, headers
        
        # Agregar request actual
        await self.redis.zadd(identifier, {str(now): now})
        await self.redis.expire(identifier, self.window_size)
        
        return True, headers


# Ejemplo de uso con FastAPI
def setup_rate_limiting(app):
    """
    Configura rate limiting en la aplicación FastAPI.
    """
    # Agregar middleware de rate limiting
    app.add_middleware(
        RateLimitMiddleware,
        default_requests_per_minute=60,      # 60 req/min para usuarios anónimos
        authenticated_requests_per_minute=100, # 100 req/min para usuarios autenticados
        admin_requests_per_minute=200        # 200 req/min para administradores
    )
    
    # Handler para errores de rate limiting
    @app.exception_handler(status.HTTP_429_TOO_MANY_REQUESTS)
    async def rate_limit_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "rate_limit_exceeded",
                "message": "Has excedido el límite de solicitudes permitidas.",
                "retry_after": exc.headers.get("Retry-After", "60")
            },
            headers=exc.headers or {}
        )


# Ejemplo de endpoints con rate limiting
"""
from app.core.rate_limiting import strict_rate_limit, auth_rate_limit, api_rate_limit

@router.post("/auth/login")
@auth_rate_limit()
async def login(request: Request, credentials: LoginData):
    # Lógica de login
    pass

@router.post("/sensitive-action")
@strict_rate_limit()
async def sensitive_action(request: Request, data: ActionData):
    # Acción sensible
    pass

@router.get("/api/data")
@api_rate_limit()
async def get_data(request: Request):
    # Obtener datos
    pass
"""