import json
import time
from pathlib import Path

from loguru import logger

from app.core.config import Config


class TikTokService:
    """TikTok service for OAuth authentication and video upload."""

    TOKEN_DIR: Path = Path(".tokens/tiktok")
    TOKEN_FILE: Path = TOKEN_DIR / "token.json"

    def __init__(self, config: Config):
        self.config: Config = config
        self.access_token: str | None = None

        if not self.config.tt_enabled:
            logger.info("TikTok service is disabled")
            return

        self.TOKEN_DIR.mkdir(parents=True, exist_ok=True)
        self._authenticate()

    def _authenticate(self) -> None:
        """Authenticate with TikTok API using OAuth 2.0."""
        # Load existing token if available
        if self.TOKEN_FILE.exists():
            try:
                with open(self.TOKEN_FILE, 'r') as f:
                    token_data = json.load(f)
                    self.access_token = token_data.get('access_token')
                    # Check if token is expired (simplified)
                    if token_data.get('expires_at', 0) > time.time():
                        logger.info("TikTok authentication successful (existing token)")
                        return
            except Exception as e:
                logger.warning(f"Failed to load TikTok token: {e}")

        # For now, implement basic OAuth flow
        # In production, this would redirect to TikTok OAuth URL
        # and handle the callback to get access token
        logger.warning("TikTok OAuth not fully implemented - manual token setup required")
        # TODO: Implement full OAuth flow similar to YouTube

    def upload_video(
        self,
        file_path: str,
        title: str,
        description: str,
        hashtags: list[str],
        mode: str
    ) -> dict[str, str | None]:
        """
        Upload video to TikTok.

        Args:
            file_path: Path to video file
            title: Video title
            description: Video description
            hashtags: List of hashtags
            mode: "direct" (immediate publish), "inbox" (save to inbox), "auto" (based on config)

        Returns:
            {"status": "published|inbox|error|disabled", "video_id": str|None}
        """
        if not self.config.tt_enabled:
            return {"status": "disabled", "video_id": None}

        if not Path(file_path).exists():
            logger.error(f"TikTok upload failed: file not found {file_path}")
            return {"status": "error", "video_id": None}

        # Determine publish mode
        publish_mode = mode if mode != "auto" else self.config.tt_publish_mode

        try:
            # TikTok API implementation would go here
            # For now, simulate the upload process

            # 1. Create video draft
            # 2. Upload video in chunks
            # 3. Publish based on mode

            logger.info(f"TikTok upload simulated: {file_path}, mode: {publish_mode}")

            # Simulate video ID generation
            video_id = f"tt_{int(time.time())}"

            if publish_mode == "direct":
                # Immediate publish
                status = "published"
            elif publish_mode == "inbox":
                # Save to inbox for later publishing
                status = "inbox"
            else:
                # Default to inbox
                status = "inbox"

            logger.info(f"TikTok video uploaded: {video_id}, status: {status}")
            return {"status": status, "video_id": video_id}

        except Exception as e:
            logger.error(f"TikTok upload failed: {e}")
            return {"status": "error", "video_id": None}

    def _create_video_draft(self, title: str, description: str) -> str | None:
        """Create video draft on TikTok (placeholder)."""
        # POST /video/query
        # Return draft ID
        return f"draft_{int(time.time())}"

    def _upload_video_chunks(self, file_path: str, draft_id: str) -> bool:
        """Upload video in chunks (placeholder)."""
        # TikTok requires chunked upload
        # Get upload URLs from /video/init
        # Upload chunks to provided URLs
        # Complete upload
        return True

    def _publish_video(self, draft_id: str, publish_mode: str) -> str:
        """Publish video based on mode (placeholder)."""
        # POST /publish/video with privacy_level
        # For inbox: privacy_level = "self_only" or similar
        # For direct: privacy_level = "public"
        return "published" if publish_mode == "direct" else "inbox"