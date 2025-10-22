import pytest
from unittest.mock import Mock, patch
from pathlib import Path

from app.services.tiktok_service import TikTokService
from app.core.config import Config


class TestTikTokService:
    """Unit tests for TikTokService."""

    @pytest.fixture
    def mock_config_disabled(self):
        """Mock configuration with TikTok disabled."""
        config = Mock(spec=Config)
        config.tt_enabled = False
        return config

    @pytest.fixture
    def mock_config_enabled(self):
        """Mock configuration with TikTok enabled."""
        config = Mock(spec=Config)
        config.tt_enabled = True
        config.tt_client_key = "test_key"
        config.tt_client_secret = "test_secret"
        config.tt_publish_mode = "auto"
        return config

    @pytest.fixture
    def tiktok_service_disabled(self, mock_config_disabled):
        """TikTok service instance with disabled config."""
        return TikTokService(mock_config_disabled)

    @pytest.fixture
    def tiktok_service_enabled(self, mock_config_enabled):
        """TikTok service instance with enabled config."""
        with patch.object(TikTokService, '_authenticate'):
            return TikTokService(mock_config_enabled)

    def test_disabled_service_returns_disabled_status(self, tiktok_service_disabled):
        """Test that disabled service returns 'disabled' status."""
        result = tiktok_service_disabled.upload_video(
            "test.mp4", "title", "desc", ["tag"], "inbox"
        )
        assert result == {"status": "disabled", "video_id": None}

    def test_enabled_service_inbox_mode(self, tiktok_service_enabled, tmp_path):
        """Test upload with inbox mode."""
        # Create a temporary video file
        video_file = tmp_path / "test.mp4"
        video_file.write_text("fake video content")

        result = tiktok_service_enabled.upload_video(
            str(video_file), "Test Title", "Test Description", ["#tiktok", "test"], "inbox"
        )

        assert result["status"] == "inbox"
        assert result["video_id"] is not None
        assert result["video_id"].startswith("tt_")

    def test_enabled_service_direct_mode(self, tiktok_service_enabled, tmp_path):
        """Test upload with direct mode."""
        video_file = tmp_path / "test.mp4"
        video_file.write_text("fake video content")

        result = tiktok_service_enabled.upload_video(
            str(video_file), "Test Title", "Test Description", ["#tiktok"], "direct"
        )

        assert result["status"] == "published"
        assert result["video_id"] is not None

    def test_enabled_service_auto_mode_defaults_to_config(self, tiktok_service_enabled, tmp_path):
        """Test upload with auto mode uses config default."""
        video_file = tmp_path / "test.mp4"
        video_file.write_text("fake video content")

        # Config has tt_publish_mode = "auto", but since mode != "auto", it uses config
        # Wait, in code: publish_mode = mode if mode != "auto" else self.config.tt_publish_mode
        # So for "auto", uses config.tt_publish_mode which is "auto", then defaults to "inbox"

        result = tiktok_service_enabled.upload_video(
            str(video_file), "Test Title", "Test Description", ["#tiktok"], "auto"
        )

        assert result["status"] == "inbox"  # Default when config is "auto"

    def test_file_not_found_returns_error(self, tiktok_service_enabled):
        """Test that missing file returns error status."""
        result = tiktok_service_enabled.upload_video(
            "nonexistent.mp4", "title", "desc", ["tag"], "inbox"
        )
        assert result == {"status": "error", "video_id": None}

    @patch('app.services.tiktok_service.logger')
    def test_upload_logs_correctly(self, mock_logger, tiktok_service_enabled, tmp_path):
        """Test that upload logs the correct information."""
        video_file = tmp_path / "test.mp4"
        video_file.write_text("fake video content")

        result = tiktok_service_enabled.upload_video(
            str(video_file), "Test Title", "Test Description", ["#tiktok"], "inbox"
        )

        # Check that info logs were called
        mock_logger.info.assert_any_call(f"TikTok upload simulated: {video_file}, mode: inbox")
        mock_logger.info.assert_any_call(f"TikTok video uploaded: {result['video_id']}, status: inbox")