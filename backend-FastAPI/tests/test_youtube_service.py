import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch, mock_open
from pathlib import Path

from app.services.youtube_service import YouTubeService
from app.core.config import Config


class TestYouTubeService:
    """Unit tests for YouTubeService."""

    @pytest.fixture
    def mock_config(self):
        """Mock configuration for testing."""
        config = Mock(spec=Config)
        config.yt_tags_extra = ["extra1", "extra2"]
        return config

    @pytest.fixture
    def youtube_service(self, mock_config):
        """YouTube service instance with mocked config."""
        mock_db = Mock()
        with patch.object(YouTubeService, '_authenticate'):
            service = YouTubeService(mock_config, 1, mock_db)  # user_id=1, db=mock_db
            service.youtube = Mock()
            return service

    def test_normalize_tags_basic(self, youtube_service):
        """Test basic tag normalization."""
        hashtags = ["#python", "programming ", "  tutorial"]
        result = youtube_service._normalize_tags(hashtags)
        expected = ["python", "programming", "tutorial", "extra1", "extra2"]
        assert result == expected

    def test_normalize_tags_deduplication(self, youtube_service):
        """Test tag deduplication (case insensitive)."""
        hashtags = ["Python", "#python", "PROGRAMMING", "programming"]
        result = youtube_service._normalize_tags(hashtags)
        expected = ["Python", "PROGRAMMING", "extra1", "extra2"]
        assert result == expected

    def test_normalize_tags_length_limit(self, youtube_service):
        """Test tag length limit of 500 characters."""
        long_tag = "a" * 485  # 485 chars
        hashtags = [long_tag, "short"]
        result = youtube_service._normalize_tags(hashtags)
        # Should include long_tag, short, extra1, but not extra2 due to length
        assert long_tag in result
        assert "short" in result
        assert "extra1" in result
        assert "extra2" not in result  # Would exceed 500 chars

    def test_normalize_tags_empty_and_whitespace(self, youtube_service):
        """Test handling of empty and whitespace-only tags."""
        hashtags = ["", "   ", "#", "valid"]
        result = youtube_service._normalize_tags(hashtags)
        expected = ["valid", "extra1", "extra2"]
        assert result == expected

    def test_normalize_tags_no_extra_tags(self, youtube_service):
        """Test when config has no extra tags."""
        youtube_service.config.yt_tags_extra = []
        hashtags = ["tag1", "tag2"]
        result = youtube_service._normalize_tags(hashtags)
        assert result == ["tag1", "tag2"]

    @patch('app.services.youtube_service.datetime')
    def test_schedule_publish_rfc3339_format(self, mock_datetime, youtube_service):
        """Test that schedule_publish formats datetime correctly as RFC3339 UTC."""
        # Mock datetime with timezone
        test_dt = datetime(2025, 10, 15, 14, 30, 0, tzinfo=timezone.utc)
        mock_datetime.now.return_value = test_dt

        # Mock the API call
        youtube_service.youtube.videos.return_value.update.return_value.execute.return_value = {}

        youtube_service.schedule_publish("test_video_id", test_dt)

        # Verify the API was called with correct format
        call_args = youtube_service.youtube.videos.return_value.update.call_args
        body = call_args[1]['body']
        expected_publish_at = "2025-10-15T14:30:00Z"
        assert body['status']['publishAt'] == expected_publish_at

    def test_schedule_publish_naive_datetime_raises_error(self, youtube_service):
        """Test that naive datetime raises ValueError."""
        naive_dt = datetime(2025, 10, 15, 14, 30, 0)
        with pytest.raises(ValueError, match="publish_at must be timezone-aware"):
            youtube_service.schedule_publish("test_video_id", naive_dt)

    @patch('app.services.youtube_service.datetime')
    def test_schedule_publish_converts_to_utc(self, mock_datetime, youtube_service):
        """Test that non-UTC datetime is converted to UTC."""
        # Mock datetime with different timezone (e.g., EST = UTC-5)
        from datetime import timedelta
        est_tz = timezone(timedelta(hours=-5))
        test_dt = datetime(2025, 10, 15, 9, 30, 0, tzinfo=est_tz)  # 9:30 EST = 14:30 UTC

        youtube_service.youtube.videos.return_value.update.return_value.execute.return_value = {}

        youtube_service.schedule_publish("test_video_id", test_dt)

        # Verify converted to UTC
        call_args = youtube_service.youtube.videos.return_value.update.call_args
        body = call_args[1]['body']
        expected_publish_at = "2025-10-15T14:30:00Z"
        assert body['status']['publishAt'] == expected_publish_at

    def test_schedule_publish_sets_privacy_to_private(self, youtube_service):
        """Test that scheduling sets privacy status to private."""
        test_dt = datetime(2025, 10, 15, 14, 30, 0, tzinfo=timezone.utc)

        youtube_service.youtube.videos.return_value.update.return_value.execute.return_value = {}

        youtube_service.schedule_publish("test_video_id", test_dt)

        call_args = youtube_service.youtube.videos.return_value.update.call_args
        body = call_args[1]['body']
        assert body['status']['privacyStatus'] == 'private'