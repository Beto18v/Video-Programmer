"""
Middleware para agregar headers de seguridad HTTP.
"""

from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware que agrega headers de seguridad HTTP a todas las respuestas.
    """
    
    def __init__(
        self,
        app,
        hsts_max_age: int = 31536000,  # 1 año
        hsts_include_subdomains: bool = True,
        hsts_preload: bool = True,
        content_type_options: bool = True,
        frame_options: str = "DENY",  # DENY, SAMEORIGIN, ALLOW-FROM
        xss_protection: bool = True,
        referrer_policy: str = "strict-origin-when-cross-origin",
        csp_policy: Optional[str] = None,
        permissions_policy: Optional[str] = None,
    ):
        super().__init__(app)
        self.hsts_max_age = hsts_max_age
        self.hsts_include_subdomains = hsts_include_subdomains
        self.hsts_preload = hsts_preload
        self.content_type_options = content_type_options
        self.frame_options = frame_options
        self.xss_protection = xss_protection
        self.referrer_policy = referrer_policy
        self.csp_policy = csp_policy or self._default_csp_policy()
        self.permissions_policy = permissions_policy or self._default_permissions_policy()
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # HSTS (HTTP Strict Transport Security)
        if request.url.scheme == "https":
            hsts_value = f"max-age={self.hsts_max_age}"
            if self.hsts_include_subdomains:
                hsts_value += "; includeSubDomains"
            if self.hsts_preload:
                hsts_value += "; preload"
            response.headers["Strict-Transport-Security"] = hsts_value
        
        # X-Content-Type-Options
        if self.content_type_options:
            response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        if self.frame_options:
            response.headers["X-Frame-Options"] = self.frame_options
        
        # X-XSS-Protection (aunque es legacy, algunos navegadores viejos lo usan)
        if self.xss_protection:
            response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer-Policy
        if self.referrer_policy:
            response.headers["Referrer-Policy"] = self.referrer_policy
        
        # Content-Security-Policy
        if self.csp_policy:
            response.headers["Content-Security-Policy"] = self.csp_policy
        
        # Permissions-Policy (anteriormente Feature-Policy)
        if self.permissions_policy:
            response.headers["Permissions-Policy"] = self.permissions_policy
        
        # Cross-Origin-Embedder-Policy
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        
        # Cross-Origin-Opener-Policy
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        
        # Cross-Origin-Resource-Policy
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        
        # X-DNS-Prefetch-Control
        response.headers["X-DNS-Prefetch-Control"] = "off"
        
        # X-Download-Options (para IE)
        response.headers["X-Download-Options"] = "noopen"
        
        # X-Permitted-Cross-Domain-Policies
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        
        # Cache-Control para endpoints sensibles
        if self._is_sensitive_endpoint(request.url.path):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        return response
    
    def _default_csp_policy(self) -> str:
        """
        Política CSP por defecto - muy restrictiva pero funcional.
        Personaliza según las necesidades de tu aplicación.
        """
        return (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'; "
            "frame-src 'none'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests;"
        )
    
    def _default_permissions_policy(self) -> str:
        """
        Política de permisos por defecto - deshabilita características sensibles.
        """
        return (
            "accelerometer=(), "
            "ambient-light-sensor=(), "
            "autoplay=(), "
            "battery=(), "
            "camera=(), "
            "cross-origin-isolated=(), "
            "display-capture=(), "
            "document-domain=(), "
            "encrypted-media=(), "
            "execution-while-not-rendered=(), "
            "execution-while-out-of-viewport=(), "
            "fullscreen=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "keyboard-map=(), "
            "magnetometer=(), "
            "microphone=(), "
            "midi=(), "
            "navigation-override=(), "
            "payment=(), "
            "picture-in-picture=(), "
            "publickey-credentials-get=(), "
            "screen-wake-lock=(), "
            "sync-xhr=(), "
            "usb=(), "
            "web-share=(), "
            "xr-spatial-tracking=()"
        )
    
    def _is_sensitive_endpoint(self, path: str) -> bool:
        """
        Determina si un endpoint es sensible y necesita headers de cache especiales.
        """
        sensitive_patterns = [
            "/api/v1/auth/",
            "/api/v1/admin/",
            "/api/v1/user/profile",
            "/api/v1/payments/",
        ]
        
        return any(pattern in path for pattern in sensitive_patterns)


class CustomSecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware personalizable para headers de seguridad específicos de la aplicación.
    """
    
    def __init__(
        self,
        app,
        custom_headers: Optional[dict[str, str]] = None,
        remove_server_header: bool = True,
        remove_x_powered_by: bool = True,
    ):
        super().__init__(app)
        self.custom_headers = custom_headers or {}
        self.remove_server_header = remove_server_header
        self.remove_x_powered_by = remove_x_powered_by
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Agregar headers personalizados
        for header, value in self.custom_headers.items():
            response.headers[header] = value
        
        # Remover headers que revelan información del servidor
        if self.remove_server_header and "Server" in response.headers:
            del response.headers["Server"]
        
        if self.remove_x_powered_by and "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]
        
        return response


def setup_security_headers(app, environment: str = "production"):
    """
    Configura headers de seguridad en la aplicación FastAPI.
    
    Args:
        app: Instancia de FastAPI
        environment: Entorno (development, staging, production)
    """
    
    # Configuración específica por entorno
    if environment == "development":
        # CSP más permisiva para desarrollo
        csp_policy = (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' ws: wss:; "
            "font-src 'self' data:; "
        )
        frame_options = "SAMEORIGIN"  # Permite iframes para debugging
        hsts_max_age = 3600  # 1 hora para desarrollo
    else:
        # Configuración estricta para producción
        csp_policy = None  # Usar la política por defecto
        frame_options = "DENY"
        hsts_max_age = 31536000  # 1 año
    
    # Agregar middleware de headers de seguridad
    app.add_middleware(
        SecurityHeadersMiddleware,
        hsts_max_age=hsts_max_age,
        frame_options=frame_options,
        csp_policy=csp_policy,
    )
    
    # Headers personalizados
    custom_headers = {
        "X-API-Version": "1.0",
        "X-Environment": environment,
    }
    
    app.add_middleware(
        CustomSecurityHeadersMiddleware,
        custom_headers=custom_headers,
        remove_server_header=True,
        remove_x_powered_by=True,
    )


# Ejemplo de configuración específica para Video Programmer
def setup_video_programmer_security(app, environment: str = "production"):
    """
    Configuración de seguridad específica para Video Programmer.
    """
    
    # CSP personalizada para aplicación de video
    if environment == "production":
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "media-src 'self' blob:; "
            "connect-src 'self' https://api.mercadopago.com https://www.googleapis.com; "
            "frame-src 'self' https://www.youtube.com https://player.vimeo.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests;"
        )
    else:
        csp_policy = (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "img-src 'self' data: https: blob:; "
            "media-src 'self' blob:; "
            "connect-src 'self' ws: wss: https:; "
            "frame-src 'self' https:; "
        )
    
    app.add_middleware(
        SecurityHeadersMiddleware,
        csp_policy=csp_policy,
        frame_options="SAMEORIGIN",  # Permitir embeds de YouTube/Vimeo
    )
    
    # Headers específicos de la aplicación
    custom_headers = {
        "X-API-Name": "Video-Programmer-API",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
    }
    
    app.add_middleware(
        CustomSecurityHeadersMiddleware,
        custom_headers=custom_headers,
    )