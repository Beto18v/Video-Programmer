"""
Main application module for Video Programmer API - Enhanced Security Version.

This module initializes the FastAPI application with comprehensive security features,
logging, error handling, and best practices implementation.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Import security and logging components
from app.core.security_headers import setup_video_programmer_security
from app.core.rate_limiting import setup_rate_limiting
from app.core.logging_config import setup_complete_logging_and_error_handling

# Import API routers
from app.api.v1.router import api_router
from app.api import routes
from app.api.payment_routes import router as payment_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for application startup and shutdown.
    """
    # Startup
    from app.db.session import create_tables
    create_tables()
    
    # Log application startup
    from app.core.logging_config import logger
    logger.info("Video Programmer API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Video Programmer API shutting down")


def create_app(environment: str = None) -> FastAPI:
    """
    Create and configure the FastAPI application with security enhancements.
    
    Args:
        environment: Environment name (development, staging, production)
    
    Returns:
        Configured FastAPI application
    """
    
    # Determine environment
    if environment is None:
        environment = os.getenv("ENVIRONMENT", "production")
    
    # Create FastAPI app with enhanced configuration
    app = FastAPI(
        title="Video Programmer API",
        version="1.0.0",
        description="Secure API for automated video programming with enhanced security features",
        docs_url="/docs" if environment == "development" else None,  # Disable docs in production
        redoc_url="/redoc" if environment == "development" else None,  # Disable redoc in production
        openapi_url="/openapi.json" if environment == "development" else None,  # Disable OpenAPI in production
        lifespan=lifespan
    )
    
    # Configure trusted hosts (prevent Host header attacks)
    if environment == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["your-domain.com", "*.your-domain.com", "localhost"]
        )
    
    # Configure CORS with security considerations
    if environment == "development":
        # Permissive CORS for development
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
    else:
        # Restrictive CORS for production
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["https://your-domain.com", "https://www.your-domain.com"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
            expose_headers=["X-Request-ID"]
        )
    
    # Setup security headers
    setup_video_programmer_security(app, environment)
    
    # Setup rate limiting
    setup_rate_limiting(app)
    
    # Setup comprehensive logging and error handling
    setup_complete_logging_and_error_handling(app, environment)
    
    # Include API routers
    app.include_router(api_router, prefix="/api/v1", tags=["v1"])
    app.include_router(routes.router, prefix="/api/v1", tags=["routes"])
    app.include_router(payment_router, prefix="/api/v1/payments", tags=["payments"])
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        """
        Health check endpoint for monitoring and load balancers.
        """
        return {
            "status": "healthy",
            "version": "1.0.0",
            "environment": environment
        }
    
    # Readiness probe endpoint
    @app.get("/ready", tags=["health"])
    async def readiness_check():
        """
        Readiness check endpoint for Kubernetes deployments.
        """
        try:
            # Add any additional checks here (database, external services, etc.)
            from app.db.session import get_db
            next(get_db()).execute("SELECT 1")  # Simple DB check
            
            return {
                "status": "ready",
                "checks": {
                    "database": "ok"
                }
            }
        except Exception as e:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Service not ready: {str(e)}"
            )
    
    # Liveness probe endpoint
    @app.get("/live", tags=["health"])
    async def liveness_check():
        """
        Liveness check endpoint for Kubernetes deployments.
        """
        return {"status": "alive"}
    
    return app


# Create the application instance
app = create_app()


# For backward compatibility and direct uvicorn usage
if __name__ == "__main__":
    import uvicorn
    
    # Configuration for development
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )