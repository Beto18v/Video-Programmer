"""
Authentication middleware for FastAPI.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.services.auth_service import AuthService


class AuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # Skip auth for certain endpoints
        if self._should_skip_auth(request.url.path):
            await self.app(scope, receive, send)
            return

        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            response = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authorization header missing or invalid"},
                headers={"WWW-Authenticate": "Bearer"},
            )
            await response(scope, receive, send)
            return

        token = auth_header.split(" ")[1]
        user = AuthService.verify_token(token)
        if not user:
            response = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid token"},
                headers={"WWW-Authenticate": "Bearer"},
            )
            await response(scope, receive, send)
            return

        # Add user to request state
        scope["user"] = user
        await self.app(scope, receive, send)

    @staticmethod
    def _should_skip_auth(path: str) -> bool:
        """Check if the path should skip authentication."""
        skip_paths = [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/oauth2/authorize/google",  # OAuth flow
            "/api/v1/login",  # If you have a login endpoint
        ]
        return any(path.startswith(skip) for skip in skip_paths)