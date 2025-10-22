import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Union, Any

import httpx
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from loguru import logger

from app.core.config import Config


class YouTubeService:
    """YouTube service for OAuth authentication, video upload, thumbnail setting, and scheduling."""

    SCOPES: list[str] = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]
    API_SERVICE_NAME: str = "youtube"
    API_VERSION: str = "v3"
    CREDENTIALS_FILE: Path = Path("credentials.json")  # Should be in project root

    def __init__(self, config: Config, channel: str):
        self.config: Config = config
        self.channel: str = channel
        self.youtube: Any = None
        self.TOKEN_DIR: Path = Path(f".tokens/{channel}")
        self.TOKEN_FILE: Path = self.TOKEN_DIR / "token.json"
        self._authenticate()

    def _authenticate(self) -> None:
        """Authenticate with YouTube API using OAuth 2.0."""
        creds = None

        # Ensure token directory exists
        self.TOKEN_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"Token directory ensured: {self.TOKEN_DIR}")

        # Load existing token if available
        if self.TOKEN_FILE.exists():
            try:
                with open(self.TOKEN_FILE, 'r') as token:
                    creds_data = json.load(token)
                    creds = Credentials.from_authorized_user_info(creds_data)
                logger.info("Existing token loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load token: {e}")

        # Refresh or re-authenticate if needed
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                logger.info("Token refreshed successfully")
            except Exception as e:
                logger.warning(f"Failed to refresh token: {e}")
                creds = None

        if not creds:
            raise Exception(f"No valid credentials found for channel '{self.channel}'. Please authenticate via /oauth2/authorize/youtube/{self.channel} first.")

        # Save token
        with open(self.TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        logger.info(f"Token saved to {self.TOKEN_FILE}")

        # Build YouTube API client
        self.youtube = build(self.API_SERVICE_NAME, self.API_VERSION, credentials=creds)
        logger.info("YouTube authentication successful")

    def _normalize_tags(self, hashtags: list[str]) -> list[str]:
        """Normalize tags by combining with TAGS_EXTRA, removing #, deduplicating, and limiting to 500 chars."""
        # Combine hashtags and extra tags
        extra_tags = self.config.yt_tags_extra if isinstance(self.config.yt_tags_extra, list) else []
        all_tags = hashtags + extra_tags

        # Remove # and strip whitespace, filter empty
        normalized = [tag.lstrip('#').strip() for tag in all_tags]
        normalized = [tag for tag in normalized if tag]  # Remove empty strings

        # Remove duplicates while preserving order (case insensitive)
        seen = set()
        unique_tags = []
        for tag in normalized:
            if tag.lower() not in seen:
                seen.add(tag.lower())
                unique_tags.append(tag)

        # Limit total length to 500 characters
        total_length = 0
        final_tags = []
        for tag in unique_tags:
            if total_length + len(tag) <= 500:
                final_tags.append(tag)
                total_length += len(tag)
            else:
                break

        return final_tags

    def _retry_with_backoff(self, func, *args, max_retries=5, **kwargs):
        """Execute function with exponential backoff retry."""
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except HttpError as e:
                if e.resp.status in [500, 502, 503, 504, 429]:  # Quota exceeded
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt + 1  # Exponential backoff with +1 to avoid 1s
                        logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s: {e}")
                        time.sleep(wait_time)
                        continue
                logger.error(f"YouTube API error after {max_retries} retries: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                raise

    def upload_video(
        self,
        file_path: str,
        title: str,
        description: str,
        tags: list[str],
        category_id: Union[str, int],
        privacy_status: str,
        made_for_kids: bool
    ) -> dict[str, str]:
        """Upload a video to YouTube and return video ID and URL."""
        if not Path(file_path).exists():
            raise FileNotFoundError(f"Video file not found: {file_path}")

        logger.info(f"Starting upload for video: {file_path}, title: {title}")
        normalized_tags = self._normalize_tags(tags)
        logger.debug(f"Normalized tags: {normalized_tags}")

        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": normalized_tags,
                "categoryId": str(category_id)
            },
            "status": {
                "privacyStatus": privacy_status,
                "madeForKids": made_for_kids
            }
        }

        media = MediaFileUpload(file_path, chunksize=-1, resumable=True)

        def _upload():
            request = self.youtube.videos().insert(
                part="snippet,status",
                body=body,
                media_body=media
            )
            response = request.execute()
            return response

        response = self._retry_with_backoff(_upload)

        video_id = response["id"]
        url = f"https://www.youtube.com/watch?v={video_id}"

        logger.info(f"Video uploaded successfully: {video_id}, URL: {url}")
        return {"video_id": video_id, "url": url}

    def set_thumbnail(self, video_id: str, thumb_path_or_url: str) -> None:
        """Set thumbnail for a YouTube video."""
        if thumb_path_or_url.startswith(('http://', 'https://')):
            # URL thumbnail - need to download first
            response = httpx.get(thumb_path_or_url)
            response.raise_for_status()
            media = MediaFileUpload(thumb_path_or_url, mimetype='image/jpeg')
        else:
            # Local file
            if not Path(thumb_path_or_url).exists():
                raise FileNotFoundError(f"Thumbnail file not found: {thumb_path_or_url}")
            media = MediaFileUpload(thumb_path_or_url, chunksize=-1, resumable=True)

        def _set_thumb():
            request = self.youtube.thumbnails().set(
                videoId=video_id,
                media_body=media
            )
            return request.execute()

        self._retry_with_backoff(_set_thumb)
        logger.info(f"Thumbnail set for video {video_id}")

    def schedule_publish(self, video_id: str, publish_at: datetime) -> None:
        """Schedule video publication at specified datetime (must be UTC)."""
        if publish_at.tzinfo is None:
            raise ValueError("publish_at must be timezone-aware")

        # Convert to UTC if not already
        publish_at_utc = publish_at.astimezone(timezone.utc)

        # Format as RFC3339
        publish_at_rfc3339 = publish_at_utc.isoformat().replace('+00:00', 'Z')

        body = {
            "id": video_id,
            "status": {
                "publishAt": publish_at_rfc3339,
                "privacyStatus": "private"  # Must be private when scheduling
            }
        }

        def _schedule():
            request = self.youtube.videos().update(
                part="status",
                body=body
            )
            return request.execute()

        self._retry_with_backoff(_schedule)
        logger.info(f"Video {video_id} scheduled for publication at {publish_at_rfc3339}")

    def verify_video_exists(self, video_id: str) -> bool:
        """Verify that a video exists and is accessible in the channel."""
        try:
            request = self.youtube.videos().list(
                part="status",
                id=video_id
            )
            response = request.execute()

            if response.get("items"):
                video = response["items"][0]
                status = video.get("status", {})
                # Check if video is not deleted/private
                if status.get("privacyStatus") in ["public", "unlisted", "private"]:
                    logger.info(f"Video {video_id} verified successfully")
                    return True

            logger.warning(f"Video {video_id} not found or not accessible")
            return False

        except Exception as e:
            logger.error(f"Error verifying video {video_id}: {e}")
            return False