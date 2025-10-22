import pytest
from pathlib import Path
from unittest.mock import Mock, patch
from app.services.ffmpeg_service import safe_concat, FFmpegError


class TestFFmpegService:
    """Pruebas para el servicio de FFmpeg."""

    @patch('app.services.ffmpeg_service.subprocess.run')
    @patch('app.services.ffmpeg_service.tempfile.NamedTemporaryFile')
    @patch('app.services.ffmpeg_service.Path')
    def test_safe_concat_copy_success(self, mock_path, mock_tempfile, mock_run):
        """Prueba concatenación exitosa con modo copy."""
        # Mock Path
        mock_path_instance = Mock()
        mock_path.return_value = mock_path_instance
        mock_path_instance.exists.return_value = True
        mock_path_instance.__str__ = Mock(return_value='/path/to/file.mp4')

        # Mock tempfile
        mock_file = Mock()
        mock_tempfile.return_value.__enter__ = Mock(return_value=mock_file)
        mock_tempfile.return_value.__exit__ = Mock(return_value=None)

        # Mock subprocess.run para copy exitoso
        mock_run.return_value = Mock(returncode=0, stdout='', stderr='')

        input_paths = [Path('input1.mp4'), Path('input2.mp4')]
        output_path = Path('output.mp4')

        result = safe_concat(input_paths, output_path)

        # Verificar resultado
        assert result['mode'] == 'copy'
        assert result['ok'] is True
        assert result['error'] is None

        # Verificar que se llamó subprocess con copy
        assert mock_run.call_count == 1
        call_args = mock_run.call_args[0][0]
        assert '-c' in call_args
        assert 'copy' in call_args

    @patch('app.services.ffmpeg_service.concat_videos_copy')
    @patch('app.services.ffmpeg_service.concat_videos_reencode')
    def test_safe_concat_fallback_to_reencode(self, mock_reencode, mock_copy):
        """Prueba fallback a reencode cuando copy falla."""
        # Copy falla
        mock_copy.side_effect = FFmpegError("Copy failed")
        # Reencode exitoso
        mock_reencode.return_value = True

        input_paths = [Path('input1.mp4'), Path('input2.mp4')]
        output_path = Path('output.mp4')

        result = safe_concat(input_paths, output_path)

        # Verificar resultado
        assert result['mode'] == 'reencode'
        assert result['ok'] is True
        assert result['error'] is None

        # Verificar que se llamó copy primero, luego reencode
        mock_copy.assert_called_once()
        mock_reencode.assert_called_once()

    @patch('app.services.ffmpeg_service.concat_videos_copy')
    @patch('app.services.ffmpeg_service.concat_videos_reencode')
    def test_safe_concat_both_fail(self, mock_reencode, mock_copy):
        """Prueba cuando tanto copy como reencode fallan."""
        # Ambos fallan
        mock_copy.side_effect = FFmpegError("Copy failed")
        mock_reencode.side_effect = FFmpegError("Reencode failed")

        input_paths = [Path('input1.mp4'), Path('input2.mp4')]
        output_path = Path('output.mp4')

        result = safe_concat(input_paths, output_path)

        # Verificar resultado
        assert result['mode'] == 'reencode'
        assert result['ok'] is False
        assert result['error'] == "Reencode failed"

        # Verificar que se llamó ambas funciones
        mock_copy.assert_called_once()
        mock_reencode.assert_called_once()