from pathlib import Path
import json
import subprocess
import tempfile
from typing import Any


class FFmpegError(Exception):
    """Error específico para operaciones de FFmpeg."""
    pass


def ensure_ffmpeg_available() -> str:
    """
    Verifica que FFmpeg esté disponible en PATH y retorna la versión.

    Returns:
        str: Versión de FFmpeg

    Raises:
        FFmpegError: Si FFmpeg no está disponible
    """
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            check=True
        )
        # Extraer la versión de la primera línea
        first_line = result.stdout.split('\n')[0]
        version = first_line.split('version')[1].split()[0] if 'version' in first_line else 'unknown'
        return version.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        raise FFmpegError(
            "FFmpeg no está disponible en PATH. "
            "Instrucciones para instalar en Windows:\n"
            "1. Descarga FFmpeg desde https://ffmpeg.org/download.html\n"
            "2. Extrae el archivo ZIP\n"
            "3. Agrega la carpeta 'bin' al PATH del sistema\n"
            "4. Reinicia la terminal y verifica con: ffmpeg -version"
        )


def probe_video(path: str | Path) -> dict[str, Any]:
    """
    Obtiene información de un video usando ffprobe.

    Args:
        path: Ruta al archivo de video

    Returns:
        Dict: Información del video en formato JSON

    Raises:
        FFmpegError: Si hay error al procesar el video
    """
    path = Path(path)
    if not path.exists():
        raise FFmpegError(f"El archivo {path} no existe")

    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                str(path)
            ],
            capture_output=True,
            text=True,
            check=True
        )

        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        raise FFmpegError(f"Error al analizar el video {path}: {e.stderr}")
    except json.JSONDecodeError as e:
        raise FFmpegError(f"Error al parsear la salida de ffprobe: {e}")


def concat_videos_copy(input_paths: list[str | Path], output_path: str | Path) -> bool:
    """
    Concatena videos usando el demuxer concat con copia directa (sin reencoding).

    Args:
        input_paths: Lista de rutas de archivos de video de entrada
        output_path: Ruta del archivo de salida

    Returns:
        bool: True si la operación fue exitosa

    Raises:
        FFmpegError: Si hay error en la concatenación
    """
    if not input_paths:
        raise FFmpegError("La lista de archivos de entrada está vacía")

    input_paths = [Path(p) for p in input_paths]
    output_path = Path(output_path)

    # Verificar que todos los archivos existen
    for path in input_paths:
        if not path.exists():
            raise FFmpegError(f"El archivo {path} no existe")

    # Crear archivo temporal con lista de archivos
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for path in input_paths:
            f.write(f"file '{path.resolve()}'\n")
        concat_file = f.name

    try:
        result = subprocess.run(
            [
                "D:\\Documentos\\Repositories\\Canva-app\\video-programmer\\ffmpeg\\bin\\ffmpeg.exe",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c", "copy",
                "-y",  # Sobrescribir sin preguntar
                str(output_path)
            ],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        raise FFmpegError(f"Error al concatenar videos: {e.stderr}")
    finally:
        # Limpiar archivo temporal
        Path(concat_file).unlink(missing_ok=True)


def concat_videos_reencode(input_paths: list[str | Path], output_path: str | Path) -> bool:
    """
    Concatena videos con reencoding usando libx264 y AAC.

    Args:
        input_paths: Lista de rutas de archivos de video de entrada
        output_path: Ruta del archivo de salida

    Returns:
        bool: True si la operación fue exitosa

    Raises:
        FFmpegError: Si hay error en la concatenación
    """
    if not input_paths:
        raise FFmpegError("La lista de archivos de entrada está vacía")

    input_paths = [Path(p) for p in input_paths]
    output_path = Path(output_path)

    # Verificar que todos los archivos existen
    for path in input_paths:
        if not path.exists():
            raise FFmpegError(f"El archivo {path} no existe")

    # Crear archivo temporal con lista de archivos
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for path in input_paths:
            f.write(f"file '{path.resolve()}'\n")
        concat_file = f.name

    try:
        result = subprocess.run(
            [
                "D:\\Documentos\\Repositories\\Canva-app\\video-programmer\\ffmpeg\\bin\\ffmpeg.exe",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-movflags", "+faststart",
                "-y",  # Sobrescribir sin preguntar
                str(output_path)
            ],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        raise FFmpegError(f"Error al concatenar videos con reencoding: {e.stderr}")
    finally:
        # Limpiar archivo temporal
        Path(concat_file).unlink(missing_ok=True)


def safe_concat(input_paths: list[str | Path], output_path: str | Path) -> dict[str, str | bool | None]:
    """
    Concatena videos intentando primero copia directa, cayendo a reencoding si falla.

    Args:
        input_paths: Lista de rutas de archivos de video de entrada
        output_path: Ruta del archivo de salida

    Returns:
        Dict: {
            "mode": "copy" | "reencode",
            "ok": bool,
            "error": str | None
        }
    """
    # Intentar concatenación con copia
    try:
        concat_videos_copy(input_paths, output_path)
        return {
            "mode": "copy",
            "ok": True,
            "error": None
        }
    except FFmpegError as e:
        # Si falla, intentar con reencoding
        try:
            concat_videos_reencode(input_paths, output_path)
            return {
                "mode": "reencode",
                "ok": True,
                "error": None
            }
        except FFmpegError as reencode_error:
            return {
                "mode": "reencode",
                "ok": False,
                "error": str(reencode_error)
            }


class FFmpegService:
    """Servicio para operaciones de FFmpeg."""

    def __init__(self):
        """Inicializa el servicio de FFmpeg."""
        pass

    def safe_concat(self, input_files: list[str | Path], output_file: str | Path) -> dict[str, str | bool | None]:
        """
        Concatena videos intentando primero copia directa, cayendo a reencoding si falla.

        Args:
            input_files: Lista de rutas de archivos de video de entrada
            output_file: Ruta del archivo de salida

        Returns:
            Dict: {
                "mode": "copy" | "reencode",
                "ok": bool,
                "error": str | None
            }
        """
        return safe_concat(input_files, output_file)