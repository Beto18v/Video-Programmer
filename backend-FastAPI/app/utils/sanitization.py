"""
Utilidades para sanitización y validación de datos de entrada.
"""

import html
import mimetypes
import re
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException, UploadFile, status
from pydantic import BaseModel, field_validator, Field


class FileValidationConfig(BaseModel):
    """Configuración para validación de archivos."""
    max_size_mb: int = Field(default=10, description="Tamaño máximo en MB")
    allowed_extensions: list[str] = Field(default_factory=lambda: [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".avi", ".mov"])
    allowed_mime_types: list[str] = Field(default_factory=lambda: [
        "image/jpeg", "image/png", "image/gif", 
        "video/mp4", "video/avi", "video/quicktime"
    ])
    require_extension_match: bool = Field(default=True, description="Requerir que la extensión coincida con el MIME type")


class SanitizedInput(BaseModel):
    """Modelo base para inputs sanitizados."""
    
    @field_validator('*', mode='before')
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        """Sanitiza strings automáticamente."""
        if isinstance(v, str):
            return sanitize_html(v)
        return v


def sanitize_html(text: str) -> str:
    """
    Escapa caracteres HTML peligrosos.
    
    Args:
        text: Texto a sanitizar
        
    Returns:
        Texto con caracteres HTML escapados
    """
    if not isinstance(text, str):
        return text
    
    # Escapar caracteres HTML básicos
    sanitized = html.escape(text, quote=True)
    
    # Remover tags HTML completamente (más estricto)
    sanitized = re.sub(r'<[^>]+>', '', sanitized)
    
    # Remover scripts y contenido peligroso
    dangerous_patterns = [
        r'javascript:', r'vbscript:', r'onload=', r'onerror=',
        r'onclick=', r'onmouseover=', r'<script', r'</script>',
        r'<iframe', r'</iframe>', r'<object', r'</object>',
        r'<embed', r'</embed>', r'<link', r'<meta'
    ]
    
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    return sanitized.strip()


def sanitize_filename(filename: str) -> str:
    """
    Sanitiza nombres de archivo para evitar path traversal.
    
    Args:
        filename: Nombre del archivo
        
    Returns:
        Nombre de archivo sanitizado
    """
    if not filename:
        return "file"
    
    # Remover caracteres peligrosos
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Remover secuencias de path traversal
    sanitized = re.sub(r'\.\.', '_', sanitized)
    
    # Remover espacios al inicio y final
    sanitized = sanitized.strip()
    
    # Limitar longitud
    if len(sanitized) > 255:
        name, ext = Path(sanitized).stem, Path(sanitized).suffix
        sanitized = name[:255-len(ext)] + ext
    
    # Asegurar que no esté vacío
    if not sanitized or sanitized in ['.', '..']:
        sanitized = "file"
    
    return sanitized


def validate_file_upload(
    file: UploadFile, 
    config: Optional[FileValidationConfig] = None
) -> dict:
    """
    Valida archivos subidos por los usuarios.
    
    Args:
        file: Archivo subido por el usuario
        config: Configuración de validación
        
    Returns:
        Diccionario con información del archivo validado
        
    Raises:
        HTTPException: Si el archivo no pasa las validaciones
    """
    if config is None:
        config = FileValidationConfig()
    
    # Verificar que hay un archivo
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionó ningún archivo"
        )
    
    # Sanitizar nombre del archivo
    original_filename = file.filename
    safe_filename = sanitize_filename(original_filename)
    
    # Obtener extensión
    file_extension = Path(safe_filename).suffix.lower()
    
    # Validar extensión
    if file_extension not in config.allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión de archivo no permitida. Extensiones permitidas: {', '.join(config.allowed_extensions)}"
        )
    
    # Validar MIME type
    content_type = file.content_type
    if content_type not in config.allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Tipos permitidos: {', '.join(config.allowed_mime_types)}"
        )
    
    # Verificar coincidencia entre extensión y MIME type
    if config.require_extension_match:
        expected_mime, _ = mimetypes.guess_type(safe_filename)
        if expected_mime and expected_mime != content_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El tipo de archivo no coincide con la extensión"
            )
    
    # Verificar tamaño del archivo
    if hasattr(file, 'size') and file.size:
        max_size_bytes = config.max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Archivo demasiado grande. Tamaño máximo: {config.max_size_mb}MB"
            )
    
    return {
        "original_filename": original_filename,
        "safe_filename": safe_filename,
        "extension": file_extension,
        "content_type": content_type,
        "size": getattr(file, 'size', None)
    }


def sanitize_sql_like_pattern(pattern: str) -> str:
    """
    Sanitiza patrones para consultas SQL LIKE.
    
    Args:
        pattern: Patrón de búsqueda
        
    Returns:
        Patrón sanitizado
    """
    # Escapar caracteres especiales de SQL LIKE
    sanitized = pattern.replace('\\', '\\\\')
    sanitized = sanitized.replace('%', '\\%')
    sanitized = sanitized.replace('_', '\\_')
    sanitized = sanitized.replace('[', '\\[')
    sanitized = sanitized.replace(']', '\\]')
    
    return sanitized


def validate_email(email: str) -> str:
    """
    Valida y sanitiza direcciones de email.
    
    Args:
        email: Dirección de email
        
    Returns:
        Email sanitizado
        
    Raises:
        HTTPException: Si el email no es válido
    """
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email es requerido"
        )
    
    # Sanitizar
    email = email.strip().lower()
    
    # Validar formato básico
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de email inválido"
        )
    
    # Verificar longitud
    if len(email) > 254:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email demasiado largo"
        )
    
    return email


def sanitize_url(url: str) -> str:
    """
    Sanitiza URLs para evitar ataques de redirección.
    
    Args:
        url: URL a sanitizar
        
    Returns:
        URL sanitizada
        
    Raises:
        HTTPException: Si la URL no es válida
    """
    if not url:
        return ""
    
    url = url.strip()
    
    # Verificar que la URL use protocolo seguro
    if not url.startswith(('http://', 'https://')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL debe usar protocolo HTTP o HTTPS"
        )
    
    # Verificar que no contenga caracteres peligrosos
    dangerous_chars = ['<', '>', '"', "'", '`']
    for char in dangerous_chars:
        if char in url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL contiene caracteres no permitidos"
            )
    
    return url


# Ejemplos de modelos con sanitización automática
class UserInput(SanitizedInput):
    """Ejemplo de input de usuario con sanitización automática."""
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    bio: Optional[str] = Field(None, max_length=500)
    
    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v: str) -> str:
        return validate_email(v)


class VideoMetadata(SanitizedInput):
    """Ejemplo de metadatos de video con sanitización."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    tags: List[str] = Field(default_factory=list, max_length=20)
    
    @field_validator('tags')
    @classmethod
    def sanitize_tags(cls, v: List[str]) -> List[str]:
        return [sanitize_html(tag.strip()) for tag in v if tag.strip()][:20]