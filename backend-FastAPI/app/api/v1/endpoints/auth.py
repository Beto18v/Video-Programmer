"""
Authentication endpoints for YouTube OAuth.

This module handles OAuth 2.0 authentication flow for YouTube API access.
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from loguru import logger
from google_auth_oauthlib.flow import Flow

from app.core.config import Settings

router = APIRouter()

class OAuthResponse(BaseModel):
    """Response model for OAuth callback."""
    message: str
    token_saved: bool
    channel: str

@router.get("/oauth2/authorize/youtube/{channel}")
def authorize_youtube(channel: str):
    """Initiate YouTube OAuth flow for a specific channel."""
    try:
        config = Settings()
        flow = Flow.from_client_secrets_file(
            str(Path("credentials.json")),
            scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
            redirect_uri=config.yt_redirect_uri
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        # Store channel in state for callback
        state_with_channel = f"{channel}:{state}"
        authorization_url = authorization_url.replace(f"state={state}", f"state={state_with_channel}")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logger.error(f"Error initiating OAuth: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )

@router.get("/oauth2/callback/youtube", response_model=OAuthResponse)
def oauth2_callback_youtube(code: str, state: str | None = None) -> OAuthResponse:
    """Handle YouTube OAuth callback."""
    try:
        # Extract channel from state (format: "channel:original_state")
        if not state or ":" not in state:
            raise HTTPException(status_code=400, detail="Invalid state parameter")

        channel, original_state = state.split(":", 1)

        config = Settings()
        flow = Flow.from_client_secrets_file(
            str(Path("credentials.json")),
            scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
            redirect_uri=config.yt_redirect_uri
        )

        # Set the state back to the original state for flow.fetch_token
        flow._state = original_state

        flow.fetch_token(code=code)
        creds = flow.credentials

        # Ensure token directory exists
        token_dir = Path(f".tokens/{channel}")
        token_dir.mkdir(parents=True, exist_ok=True)
        with open(token_dir / "token.json", 'w') as token:
            token.write(creds.to_json())

        logger.info(f"YouTube OAuth successful for channel {channel}")
        return OAuthResponse(message=f"OAuth successful for channel {channel}", token_saved=True, channel=channel)
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"OAuth callback failed: {str(e)}"
        )