import pytest
import httpx
from unittest.mock import Mock, patch
from app.main import app
from app.db.session import get_db
from app.models.user import User, OAuthToken
from sqlalchemy.orm import Session


@pytest.fixture
async def client():
    """Test client for FastAPI app."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        yield client


@pytest.fixture
def mock_db():
    """Mock database session."""
    return Mock(spec=Session)


@pytest.fixture
def mock_user():
    """Mock user object."""
    user = Mock(spec=User)
    user.id = 1
    user.google_id = "123456789"
    user.email = "test@example.com"
    user.name = "Test User"
    user.picture = "https://example.com/photo.jpg"
    return user


@pytest.fixture
def mock_oauth_token():
    """Mock OAuth token object."""
    token = Mock(spec=OAuthToken)
    token.access_token = "mock_access_token"
    token.refresh_token = "mock_refresh_token"
    token.expires_at = None
    token.scope = ["https://www.googleapis.com/auth/userinfo.profile"]
    return token


class TestOAuthEndpoints:
    """Test OAuth2 endpoints."""

    @pytest.mark.asyncio
    async def test_login_redirect(self, client):
        """Test /login endpoint redirects to OAuth authorize."""
        response = await client.get("/api/v1/login", follow_redirects=False)
        assert response.status_code == 307
        assert "/api/v1/oauth2/authorize/google" in response.headers["location"]

    @pytest.mark.asyncio
    @patch('google_auth_oauthlib.flow.Flow.from_client_config')
    async def test_authorize_google_redirect(self, mock_from_client_config, client):
        """Test /api/v1/oauth2/authorize/google redirects to Google."""
        # Mock Flow
        mock_flow = Mock()
        mock_flow.authorization_url.return_value = ("https://accounts.google.com/oauth2/auth?client_id=test", "test_state")
        mock_from_client_config.return_value = mock_flow

        response = await client.get("/api/v1/oauth2/authorize/google", follow_redirects=False)
        assert response.status_code == 307
        assert "accounts.google.com" in response.headers["location"]
        assert "client_id" in response.headers["location"]

    @pytest.mark.asyncio
    async def test_oauth_callback_invalid_state(self, client):
        """Test OAuth callback with invalid state."""
        # Clear the states
        from app.api.routes import states
        states.clear()

        response = await client.get("/api/v1/oauth2/callback/google?code=test_code&state=invalid_state")
        assert response.status_code == 400
        assert "Invalid state" in response.json()["detail"]

    @pytest.mark.asyncio
    @patch('google_auth_oauthlib.flow.Flow.from_client_config')
    async def test_oauth_callback_flow_error(self, mock_from_client_config, client):
        """Test OAuth callback with flow error."""
        # Set a valid state
        from app.api.routes import states
        states["test_state"] = True

        mock_from_client_config.side_effect = Exception("Flow error")

        response = await client.get("/api/v1/oauth2/callback/google?code=test_code&state=test_state")
        assert response.status_code == 500
        assert "OAuth callback failed" in response.json()["detail"]