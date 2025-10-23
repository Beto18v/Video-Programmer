"""
Main application module for Video Programmer API.

This module initializes the FastAPI application, configures logging,
and includes the API routers for video processing and YouTube publishing.
"""

from fastapi import FastAPI
from loguru import logger

# Configure logging
logger.add("logs/app.log", rotation="10 MB", level="INFO")

app = FastAPI(title="Video Programmer", version="0.1.0")

# Create database tables
from app.db.session import create_tables
create_tables()

# Include API routers
from .api.v1.router import api_router
from .api import routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(routes.router, prefix="/api/v1")

@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}