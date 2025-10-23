"""
Sistema de logging estructurado y manejo centralizado de errores.
"""

import json
import sys
import traceback
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


# Configuración de Loguru para logging estructurado
def setup_logging(environment: str = "production", log_level: str = "INFO"):
    """
    Configura el sistema de logging estructurado.
    
    Args:
        environment: Entorno (development, staging, production)
        log_level: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    
    # Remover handler por defecto
    logger.remove()
    
    # Formato para desarrollo (más legible)
    if environment == "development":
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )
        logger.add(sys.stdout, format=log_format, level=log_level, colorize=True)
    else:
        # Formato JSON para producción (fácil para parsear)
        def json_formatter(record):
            try:
                return json.dumps({
                    "timestamp": str(record["time"]),
                    "level": str(record["level"].name) if hasattr(record["level"], 'name') else str(record["level"]),
                    "logger": str(record["name"]),
                    "function": str(record["function"]),
                    "line": int(record["line"]),
                    "message": str(record["message"]),
                    "extra": dict(record.get("extra", {})),
                }) + "\n"
            except Exception:
                return f'{{"timestamp": "{record["time"]}", "level": "ERROR", "message": "Logging format error"}}\n'
        
        logger.add(sys.stdout, format=json_formatter, level=log_level, serialize=False)
    
    # Log file para errores
    logger.add(
        "logs/error.log",
        format=json_formatter if environment != "development" else log_format,
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )
    
    # Log file para acceso
    logger.add(
        "logs/access.log",
        format=json_formatter if environment != "development" else log_format,
        level="INFO",
        rotation="50 MB",
        retention="14 days",
        filter=lambda record: "access" in record["extra"]
    )
    
    # Log file para auditoría
    logger.add(
        "logs/audit.log",
        format=json_formatter if environment != "development" else log_format,
        level="INFO",
        rotation="100 MB",
        retention="90 days",
        filter=lambda record: "audit" in record["extra"]
    )


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para logging automático de requests/responses.
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # Generar ID único para la request
        request_id = str(uuid4())
        
        # Información de la request
        start_time = datetime.utcnow()
        client_ip = self._get_client_ip(request)
        
        # Log de inicio de request
        logger.info(
            "Request started",
            extra={
                "access": True,
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "client_ip": client_ip,
                "user_agent": request.headers.get("User-Agent", ""),
                "content_length": request.headers.get("Content-Length", 0),
            }
        )
        
        # Agregar request_id al estado de la request
        request.state.request_id = request_id
        
        try:
            # Ejecutar request
            response = await call_next(request)
            
            # Calcular tiempo de procesamiento
            process_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Log de finalización de request
            logger.info(
                "Request completed",
                extra={
                    "access": True,
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "status_code": response.status_code,
                    "process_time": process_time,
                    "client_ip": client_ip,
                    "response_size": response.headers.get("Content-Length", 0),
                }
            )
            
            # Agregar request_id a los headers de respuesta
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as exc:
            # Calcular tiempo hasta el error
            process_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Log del error
            logger.error(
                "Request failed",
                extra={
                    "access": True,
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "client_ip": client_ip,
                    "process_time": process_time,
                    "error": str(exc),
                    "error_type": type(exc).__name__,
                    "traceback": traceback.format_exc(),
                }
            )
            
            # Re-raise para que sea manejado por el exception handler
            raise exc
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtiene la IP real del cliente."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class CustomException(HTTPException):
    """
    Excepción personalizada con información adicional para logging.
    """
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        user_message: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.user_message = user_message or detail
        self.extra_data = kwargs


# Excepciones específicas del dominio
class ValidationError(CustomException):
    """Error de validación de datos."""
    
    def __init__(self, detail: str, field: Optional[str] = None, **kwargs):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="VALIDATION_ERROR",
            user_message=f"Error de validación: {detail}",
            field=field,
            **kwargs
        )


class AuthenticationError(CustomException):
    """Error de autenticación."""
    
    def __init__(self, detail: str = "Credenciales inválidas", **kwargs):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_ERROR",
            user_message="Error de autenticación. Verifica tus credenciales.",
            headers={"WWW-Authenticate": "Bearer"},
            **kwargs
        )


class AuthorizationError(CustomException):
    """Error de autorización."""
    
    def __init__(self, detail: str = "Acceso denegado", **kwargs):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHORIZATION_ERROR",
            user_message="No tienes permisos para realizar esta acción.",
            **kwargs
        )


class ResourceNotFoundError(CustomException):
    """Recurso no encontrado."""
    
    def __init__(self, resource: str, resource_id: Optional[str] = None, **kwargs):
        detail = f"{resource} no encontrado"
        if resource_id:
            detail += f" (ID: {resource_id})"
        
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="RESOURCE_NOT_FOUND",
            user_message=f"El {resource.lower()} solicitado no existe.",
            resource=resource,
            resource_id=resource_id,
            **kwargs
        )


class BusinessLogicError(CustomException):
    """Error de lógica de negocio."""
    
    def __init__(self, detail: str, **kwargs):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="BUSINESS_LOGIC_ERROR",
            user_message=detail,
            **kwargs
        )


class ExternalServiceError(CustomException):
    """Error de servicio externo."""
    
    def __init__(self, service: str, detail: str, **kwargs):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error en servicio {service}: {detail}",
            error_code="EXTERNAL_SERVICE_ERROR",
            user_message="Servicio temporalmente no disponible. Intenta más tarde.",
            service=service,
            **kwargs
        )


def setup_exception_handlers(app):
    """
    Configura los manejadores de excepciones centralizados.
    """
    
    @app.exception_handler(CustomException)
    async def custom_exception_handler(request: Request, exc: CustomException):
        """Manejador para excepciones personalizadas."""
        
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        # Log del error con contexto
        logger.error(
            f"Custom exception: {exc.error_code or 'UNKNOWN'}",
            extra={
                "request_id": request_id,
                "error_code": exc.error_code,
                "status_code": exc.status_code,
                "detail": exc.detail,
                "user_message": exc.user_message,
                "url": str(request.url),
                "method": request.method,
                "extra_data": exc.extra_data,
            }
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code or "UNKNOWN_ERROR",
                    "message": exc.user_message,
                    "detail": exc.detail,
                    "request_id": request_id,
                    **exc.extra_data
                }
            },
            headers=exc.headers
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Manejador para HTTPException estándar."""
        
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        logger.warning(
            f"HTTP exception: {exc.status_code}",
            extra={
                "request_id": request_id,
                "status_code": exc.status_code,
                "detail": exc.detail,
                "url": str(request.url),
                "method": request.method,
            }
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                    "request_id": request_id,
                }
            },
            headers=exc.headers
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Manejador para excepciones no controladas."""
        
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        logger.critical(
            "Unhandled exception",
            extra={
                "request_id": request_id,
                "error_type": type(exc).__name__,
                "error_message": str(exc),
                "traceback": traceback.format_exc(),
                "url": str(request.url),
                "method": request.method,
            }
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Error interno del servidor",
                    "request_id": request_id,
                }
            }
        )


# Funciones de utilidad para logging estructurado
def log_user_action(user_id: str, action: str, resource: str, **kwargs):
    """
    Log de acciones de usuario para auditoría.
    """
    logger.info(
        f"User action: {action}",
        extra={
            "audit": True,
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
    )


def log_business_event(event_type: str, entity_id: str, **kwargs):
    """
    Log de eventos de negocio importantes.
    """
    logger.info(
        f"Business event: {event_type}",
        extra={
            "audit": True,
            "event_type": event_type,
            "entity_id": entity_id,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
    )


def log_security_event(event_type: str, user_id: Optional[str] = None, **kwargs):
    """
    Log de eventos de seguridad.
    """
    logger.warning(
        f"Security event: {event_type}",
        extra={
            "audit": True,
            "security": True,
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
    )


# Ejemplo de configuración completa
def setup_complete_logging_and_error_handling(app, environment: str = "production"):
    """
    Configuración completa de logging y manejo de errores.
    """
    
    # Configurar logging
    setup_logging(environment=environment)
    
    # Agregar middleware de logging
    app.add_middleware(LoggingMiddleware)
    
    # Configurar manejadores de excepciones
    setup_exception_handlers(app)
    
    logger.info(
        "Logging and error handling configured",
        extra={
            "environment": environment,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )