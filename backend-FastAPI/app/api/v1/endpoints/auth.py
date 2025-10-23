"""
Authentication endpoints for Google OAuth.

This module handles OAuth 2.0 authentication flow for Google API access.
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from loguru import logger
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.services.oauth_service import OAuthService
from app.models.user import User

router = APIRouter()

class OAuthResponse(BaseModel):
    """Response model for OAuth callback."""
    message: str
    user_id: int
    email: str
    token_saved: bool

@router.get("/oauth2/authorize/google")
def authorize_google(db: Session = Depends(get_db)):
    """Initiate Google OAuth flow."""
    try:
        config = get_settings()
        if not config.yt_client_id or not config.yt_client_secret:
            raise HTTPException(status_code=500, detail="Google OAuth credentials not configured")

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": config.yt_client_id,
                    "client_secret": config.yt_client_secret,
                    "redirect_uris": [config.yt_redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=[
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube"
            ],
            redirect_uri=config.yt_redirect_uri
        )

        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force consent screen to get refresh token
        )

        # Store state in session (simplified - in production use proper session storage)
        # For now, we'll handle state in memory, but this should be stored securely
        logger.info(f"OAuth flow initiated with state: {state}")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logger.error(f"Error initiating OAuth: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )

@router.get("/user/me")
def get_current_user(user_id: int, db: Session = Depends(get_db)):
    """Get current authenticated user info."""
    # In a real app, you'd get user_id from JWT token
    # For now, this is a placeholder - you'd need JWT authentication
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "has_oauth_token": OAuthService.get_oauth_token(db, user.id) is not None
    }

@router.post("/oauth2/refresh/{user_id}")
def refresh_oauth_token(user_id: int, db: Session = Depends(get_db)):
    """Manually refresh OAuth token for a user."""
    creds = OAuthService.refresh_token_if_needed(db, user_id)
    if not creds:
        raise HTTPException(status_code=400, detail="No valid token found or refresh failed")

    return {"message": "Token refreshed successfully"}