import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from app.services.ffmpeg_service import (
    ensure_ffmpeg_available,
    probe_video,
    concat_videos_copy,
    concat_videos_reencode,
    safe_concat,
    FFmpegError
)


class TestFFmpegService:
    """Tests para el servicio de FFmpeg."""

    @patch('subprocess.run')
    def test_ensure_ffmpeg_available_success(self, mock_run):
        """Test que FFmpeg está disponible y retorna versión."""
        mock_result = MagicMock()
        mock_result.stdout = "ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers\n"
        mock_run.return_value = mock_result

        version = ensure_ffmpeg_available()
        assert version == "6.0"
        mock_run.assert_called_once_with(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            check=True
        )

    @patch('subprocess.run')
    def test_ensure_ffmpeg_available_not_found(self, mock_run):
        """Test que lanza error cuando FFmpeg no está disponible."""
        mock_run.side_effect = FileNotFoundError()

        with pytest.raises(FFmpegError) as exc_info:
            ensure_ffmpeg_available()

        assert "FFmpeg no está disponible" in str(exc_info.value)
        assert "Instrucciones para instalar" in str(exc_info.value)

    @patch('subprocess.run')
    def test_probe_video_success(self, mock_run, tmp_path):
        """Test que probe_video funciona correctamente."""
        video_file = tmp_path / "test.mp4"
        video_file.write_text("fake video content")

        mock_result = MagicMock()
        mock_result.stdout = '{"format": {"duration": "10.5"}}'
        mock_run.return_value = mock_result

        result = probe_video(video_file)

        assert result == {"format": {"duration": "10.5"}}
        mock_run.assert_called_once()

    def test_probe_video_file_not_exists(self, tmp_path):
        """Test que probe_video lanza error si el archivo no existe."""
        non_existent_file = tmp_path / "nonexistent.mp4"

        with pytest.raises(FFmpegError) as exc_info:
            probe_video(non_existent_file)

        assert "no existe" in str(exc_info.value)

    @patch('subprocess.run')
    @patch('tempfile.NamedTemporaryFile')
    def test_concat_videos_copy_success(self, mock_tempfile, mock_run, tmp_path):
        """Test que concat_videos_copy funciona correctamente."""
        # Crear archivos de entrada falsos
        input1 = tmp_path / "input1.mp4"
        input2 = tmp_path / "input2.mp4"
        output = tmp_path / "output.mp4"

        input1.write_text("fake video 1")
        input2.write_text("fake video 2")

        # Mock del archivo temporal
        mock_file = MagicMock()
        mock_tempfile.return_value.__enter__.return_value = mock_file
        mock_tempfile.return_value.__exit__.return_value = None
        mock_tempfile.return_value.name = str(tmp_path / "concat.txt")

        # Mock de subprocess
        mock_run.return_value = MagicMock()

        result = concat_videos_copy([input1, input2], output)

        assert result is True
        mock_run.assert_called_once()
        # Verificar que se escribió en el archivo temporal
        mock_file.write.assert_any_call(f"file '{input1}'\n")
        mock_file.write.assert_any_call(f"file '{input2}'\n")

    def test_concat_videos_copy_empty_list(self):
        """Test que concat_videos_copy lanza error con lista vacía."""
        with pytest.raises(FFmpegError) as exc_info:
            concat_videos_copy([], "output.mp4")

        assert "vacía" in str(exc_info.value)

    @patch('subprocess.run')
    @patch('tempfile.NamedTemporaryFile')
    def test_concat_videos_reencode_success(self, mock_tempfile, mock_run, tmp_path):
        """Test que concat_videos_reencode funciona correctamente."""
        input1 = tmp_path / "input1.mp4"
        input2 = tmp_path / "input2.mp4"
        output = tmp_path / "output.mp4"

        input1.write_text("fake video 1")
        input2.write_text("fake video 2")

        mock_file = MagicMock()
        mock_tempfile.return_value.__enter__.return_value = mock_file
        mock_tempfile.return_value.__exit__.return_value = None
        mock_tempfile.return_value.name = str(tmp_path / "concat.txt")

        mock_run.return_value = MagicMock()

        result = concat_videos_reencode([input1, input2], output)

        assert result is True
        mock_run.assert_called_once()

    @patch('app.services.ffmpeg_service.concat_videos_copy')
    @patch('app.services.ffmpeg_service.concat_videos_reencode')
    def test_safe_concat_copy_success(self, mock_reencode, mock_copy):
        """Test que safe_concat usa copy cuando funciona."""
        mock_copy.return_value = True

        result = safe_concat(["input1.mp4", "input2.mp4"], "output.mp4")

        assert result == {"mode": "copy", "ok": True, "error": None}
        mock_copy.assert_called_once()
        mock_reencode.assert_not_called()

    @patch('app.services.ffmpeg_service.concat_videos_copy')
    @patch('app.services.ffmpeg_service.concat_videos_reencode')
    def test_safe_concat_fallback_to_reencode(self, mock_reencode, mock_copy):
        """Test que safe_concat cae a reencode cuando copy falla."""
        mock_copy.side_effect = FFmpegError("Copy failed")
        mock_reencode.return_value = True

        result = safe_concat(["input1.mp4", "input2.mp4"], "output.mp4")

        assert result == {"mode": "reencode", "ok": True, "error": None}
        mock_copy.assert_called_once()
        mock_reencode.assert_called_once()

    @patch('app.services.ffmpeg_service.concat_videos_copy')
    @patch('app.services.ffmpeg_service.concat_videos_reencode')
    def test_safe_concat_both_fail(self, mock_reencode, mock_copy):
        """Test que safe_concat retorna error cuando ambas fallan."""
        mock_copy.side_effect = FFmpegError("Copy failed")
        mock_reencode.side_effect = FFmpegError("Reencode failed")

        result = safe_concat(["input1.mp4", "input2.mp4"], "output.mp4")

        assert result["mode"] == "reencode"
        assert result["ok"] is False
        assert "Reencode failed" in result["error"]