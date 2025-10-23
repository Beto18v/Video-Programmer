from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from app.models.user import User, OAuthToken
from app.core.config import get_settings
from app.core.roles import CLIENT_ROLE_ID

settings = get_settings()

class OAuthService:
    @staticmethod
    def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
        return db.query(User).filter(User.google_id == google_id).first()

    @staticmethod
    def create_user(db: Session, google_id: str, email: str, name: str, picture: Optional[str] = None) -> User:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
            role_id=CLIENT_ROLE_ID  # Default to CLIENT role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_role(db: Session, user_id: int) -> Optional[str]:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.role:
            return user.role.name
        return None

    @staticmethod
    def is_admin(db: Session, user_id: int) -> bool:
        from app.core.roles import ADMIN_ROLE_NAME
        role = OAuthService.get_user_role(db, user_id)
        return role == ADMIN_ROLE_NAME

    @staticmethod
    def save_oauth_token(db: Session, user_id: int, creds: Credentials, channel_id: Optional[str] = None, channel_title: Optional[str] = None, is_primary: bool = False) -> OAuthToken:
        # Check if token already exists for this user and channel
        existing_token = db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.channel_id == channel_id
        ).first()

        expires_at = None
        if creds.expiry:
            expires_at = creds.expiry

        if existing_token:
            existing_token.access_token = creds.token
            existing_token.refresh_token = creds.refresh_token
            existing_token.expires_at = expires_at
            existing_token.scope = creds.scopes
            existing_token.channel_title = channel_title
            existing_token.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_token)
            return existing_token
        else:
            token = OAuthToken(
                user_id=user_id,
                access_token=creds.token,
                refresh_token=creds.refresh_token,
                expires_at=expires_at,
                scope=creds.scopes,
                channel_id=channel_id,
                channel_title=channel_title,
                is_primary=1 if is_primary else 0
            )
            db.add(token)
            db.commit()
            db.refresh(token)
            return token

    @staticmethod
    def get_oauth_token(db: Session, user_id: int, channel_id: Optional[str] = None) -> Optional[OAuthToken]:
        if channel_id:
            return db.query(OAuthToken).filter(
                OAuthToken.user_id == user_id,
                OAuthToken.channel_id == channel_id
            ).first()
        else:
            # Get primary channel token if no channel specified
            return db.query(OAuthToken).filter(
                OAuthToken.user_id == user_id,
                OAuthToken.is_primary == 1
            ).first()

    @staticmethod
    def get_user_channels(db: Session, user_id: int) -> list[OAuthToken]:
        return db.query(OAuthToken).filter(OAuthToken.user_id == user_id).all()

    @staticmethod
    def set_active_channel(db: Session, user_id: int, channel_id: str) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Check if the channel belongs to the user
        token = db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.channel_id == channel_id
        ).first()
        
        if not token:
            return False
        
        user.active_channel_id = channel_id
        db.commit()
        return True

    @staticmethod
    def get_active_channel_token(db: Session, user_id: int) -> Optional[OAuthToken]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.active_channel_id:
            # Fallback to primary channel
            return db.query(OAuthToken).filter(
                OAuthToken.user_id == user_id,
                OAuthToken.is_primary == 1
            ).first()
        
        return db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.channel_id == user.active_channel_id
        ).first()

    @staticmethod
    def refresh_token_if_needed(db: Session, user_id: int, channel_id: Optional[str] = None) -> Optional[Credentials]:
        token = OAuthService.get_oauth_token(db, user_id, channel_id)
        if not token:
            return None

        creds = Credentials(
            token=token.access_token,
            refresh_token=token.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.yt_client_id,
            client_secret=settings.yt_client_secret,
            scopes=token.scope
        )

        # Check if token is expired or will expire soon (within 5 minutes)
        if creds.expired or (creds.expiry and creds.expiry < datetime.utcnow() + timedelta(minutes=5)):
            try:
                creds.refresh(Request())
                # Update the token in DB
                OAuthService.save_oauth_token(db, user_id, creds, token.channel_id, token.channel_title, token.is_primary == 1)
            except Exception as e:
                print(f"Error refreshing token: {e}")
                return None

        return creds

    @staticmethod
    def get_google_user_info(access_token: str) -> dict:
        """Get user information from Google using access token."""
        import httpx
        headers = {"Authorization": f"Bearer {access_token}"}
        response = httpx.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
        response.raise_for_status()
        return response.json()

    @staticmethod
    def get_youtube_channel_info(access_token: str) -> dict:
        """Get YouTube channel information using access token."""
        import httpx
        headers = {"Authorization": f"Bearer {access_token}"}
        # Get channel info for the authenticated user
        response = httpx.get(
            "https://www.googleapis.com/youtube/v3/channels",
            headers=headers,
            params={
                "part": "snippet",
                "mine": "true"
            }
        )
        response.raise_for_status()
        data = response.json()
        if data.get("items"):
            channel = data["items"][0]
            return {
                "id": channel["id"],
                "title": channel["snippet"]["title"],
                "description": channel["snippet"].get("description", ""),
                "thumbnail": channel["snippet"]["thumbnails"]["default"]["url"]
            }
        return {}