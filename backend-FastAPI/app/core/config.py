from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pytz import timezone
from typing import Optional


class Settings(BaseSettings):
    # Directorios base (generales, no específicos de proyecto)
    base_source_dir: Path = Field(default=Path("./videos"))
    base_output_dir: Path = Field(default=Path("./output"))
    base_report_path: Path = Field(default=Path("./output/report.json"))

    # Configuración general
    ordering: str = Field(default="name")  # name|date
    group_size: int = Field(default=3)

    # Patrón de salida para nombres de archivo
    output_pattern: str = Field(default="Semana{week:02d}_Dia{day:02d}.mp4")

    # Fuente de metadatos
    metadata_source_type: str = Field(default="sheets")  # sheets|csv|json
    sheets_id: str | None = Field(default=None)
    sheets_range: str = Field(default="Contenido!A2:D22")
    csv_path: Path | None = Field(default=None)
    json_path: Path | None = Field(default=None)

    # Configuración de Google Sheets (genérica, no por canal específico)
    # Cada usuario/proyecto puede tener su propia configuración
    default_sheets_id: str = Field(default="")
    default_sheets_range: str = Field(default="A2:D22")

    # Google Service Account para Sheets API
    google_service_account_file: Path | None = Field(default=None)

    # Configuración temporal
    timezone: str = Field(default="America/Bogota")
    start_date: str = Field(default="2025-10-13")
    times: str | list[str] = Field(default="10:00,14:00,18:00")

    # Base de datos
    database_url: str = Field(default="postgresql://postgres@localhost:5432/video_programmer")
    postgres_password: str = Field(default="postgres")
    # database_url: str = Field(default="sqlite:///./video_programmer.db")  # Fallback para desarrollo
    secret_key: str = Field(default="your-secret-key-here")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)

    # YouTube
    yt_client_id: str = Field(default="your-google-client-id-here")  # Hardcoded for automatic handling
    yt_client_secret: str = Field(default="your-google-client-secret-here")  # Hardcoded for automatic handling
    yt_redirect_uri: str = "http://localhost:8000/api/v1/oauth2/callback/google"
    yt_category_id: str = Field(default="22")
    yt_privacy_status: str = Field(default="private")  # private|public|unlisted
    yt_made_for_kids: bool = Field(default=False)
    yt_tags_extra: str | list[str] = Field(default="educacion,curso")

    # TikTok
    tt_enabled: bool = Field(default=False)
    tt_client_key: str | None = Field(default=None)
    tt_client_secret: str | None = Field(default=None)
    tt_redirect_uri: str = Field(default="http://localhost:8080/oauth2/callback/tiktok")
    tt_publish_mode: str = Field(default="auto")  # direct|inbox|auto

    # Reporte
    report_path: Path = Field(default=Path("./output/report.json"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Permitir campos extra en .env para compatibilidad
    )

    @model_validator(mode="after")
    def build_database_url(self):
        """Construir la database_url usando la contraseña."""
        if "postgres" in self.database_url and self.postgres_password:
            # Reemplazar la URL para incluir la contraseña
            self.database_url = f"postgresql://postgres:{self.postgres_password}@localhost:5432/video_programmer"
        return self

    @field_validator("base_source_dir", "base_output_dir", "csv_path", "json_path", "base_report_path", "report_path", "google_service_account_file", mode="before")
    @classmethod
    def validate_paths(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return Path(v)
        return v

    @field_validator("base_source_dir", "base_output_dir")
    @classmethod
    def validate_directories(cls, v):
        if not v.exists():
            # Crear directorio si no existe
            v.mkdir(parents=True, exist_ok=True)
        if not v.is_dir():
            raise ValueError(f"{v} no es un directorio")
        return v

    @field_validator("ordering")
    @classmethod
    def validate_ordering(cls, v):
        if v not in ["name", "date"]:
            raise ValueError("ordering debe ser 'name' o 'date'")
        return v

    @field_validator("metadata_source_type")
    @classmethod
    def validate_metadata_source_type(cls, v):
        if v not in ["sheets", "csv", "json"]:
            raise ValueError("metadata_source_type debe ser 'sheets', 'csv' o 'json'")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v):
        try:
            timezone(v)
        except Exception:
            raise ValueError(f"Timezone '{v}' no es válido")
        return v

    @field_validator("yt_privacy_status")
    @classmethod
    def validate_yt_privacy_status(cls, v):
        if v not in ["private", "public", "unlisted"]:
            raise ValueError("yt_privacy_status debe ser 'private', 'public' o 'unlisted'")
        return v

    @field_validator("tt_publish_mode")
    @classmethod
    def validate_tt_publish_mode(cls, v):
        if v not in ["direct", "inbox", "auto"]:
            raise ValueError("tt_publish_mode debe ser 'direct', 'inbox' o 'auto'")
        return v

    @field_validator("yt_made_for_kids", "tt_enabled", mode="before")
    @classmethod
    def parse_boolean(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return v


# Singleton instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Retorna la instancia singleton de configuración."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Alias for backward compatibility
Config = Settings


class ProjectConfig:
    """Configuración específica por proyecto/usuario/canal."""

    def __init__(self, user_id: int | None = None, channel_id: str | None = None, project_name: str | None = None, db_session = None):
        self.user_id: int | None = user_id
        self.channel_id: str | None = channel_id
        self.project_name: str = project_name or f"user_{user_id}_channel_{channel_id}"
        self.db_session = db_session
        self._config_data = None

    def _load_config(self):
        """Carga la configuración desde la base de datos."""
        if self._config_data is not None:
            return self._config_data

        if not self.db_session or not self.user_id:
            # Fallback a configuración por defecto
            base_config = get_settings()
            self._config_data = {
                'source_dir': base_config.base_source_dir / self.project_name,
                'output_dir': base_config.base_output_dir / self.project_name,
                'report_path': base_config.base_output_dir / self.project_name / "report.json",
                'sheets_id': base_config.default_sheets_id,
                'sheets_range': base_config.default_sheets_range,
                'metadata_source_type': base_config.metadata_source_type,
                'ordering': base_config.ordering,
                'group_size': base_config.group_size,
                'output_pattern': base_config.output_pattern,
                'timezone': base_config.timezone,
                'start_date': base_config.start_date,
                'times': base_config.times,
                'yt_category_id': base_config.yt_category_id,
                'yt_privacy_status': base_config.yt_privacy_status,
                'yt_made_for_kids': base_config.yt_made_for_kids,
                'yt_tags_extra': base_config.yt_tags_extra,
                'tt_enabled': base_config.tt_enabled,
                'tt_publish_mode': base_config.tt_publish_mode,
            }
        else:
            # Buscar configuración específica en BD
            from app.models.user import ProjectConfig as ProjectConfigModel
            config_query = self.db_session.query(ProjectConfigModel).filter(
                ProjectConfigModel.user_id == self.user_id
            )

            if self.channel_id:
                # Buscar configuración específica del canal
                config_record = config_query.filter(
                    ProjectConfigModel.channel_id == self.channel_id
                ).first()
            else:
                # Buscar configuración global del usuario (channel_id is None)
                config_record = config_query.filter(
                    ProjectConfigModel.channel_id.is_(None)
                ).first()

            if config_record:
                # Usar configuración de BD
                self._config_data = {
                    'source_dir': Path(config_record.source_dir) if config_record.source_dir else None,
                    'output_dir': Path(config_record.output_dir) if config_record.output_dir else None,
                    'report_path': Path(config_record.report_path) if config_record.report_path else None,
                    'sheets_id': config_record.sheets_id,
                    'sheets_range': config_record.sheets_range,
                    'metadata_source_type': config_record.metadata_source_type,
                    'ordering': config_record.ordering,
                    'group_size': config_record.group_size,
                    'output_pattern': config_record.output_pattern,
                    'timezone': config_record.timezone,
                    'start_date': config_record.start_date,
                    'times': config_record.times,
                    'yt_category_id': config_record.yt_category_id,
                    'yt_privacy_status': config_record.yt_privacy_status,
                    'yt_made_for_kids': config_record.yt_made_for_kids,
                    'yt_tags_extra': config_record.yt_tags_extra,
                    'tt_enabled': config_record.tt_enabled,
                    'tt_publish_mode': config_record.tt_publish_mode,
                }
            else:
                # Fallback a configuración por defecto
                base_config = get_settings()
                self._config_data = {
                    'source_dir': base_config.base_source_dir / self.project_name,
                    'output_dir': base_config.base_output_dir / self.project_name,
                    'report_path': base_config.base_output_dir / self.project_name / "report.json",
                    'sheets_id': base_config.default_sheets_id,
                    'sheets_range': base_config.default_sheets_range,
                    'metadata_source_type': base_config.metadata_source_type,
                    'ordering': base_config.ordering,
                    'group_size': base_config.group_size,
                    'output_pattern': base_config.output_pattern,
                    'timezone': base_config.timezone,
                    'start_date': base_config.start_date,
                    'times': base_config.times,
                    'yt_category_id': base_config.yt_category_id,
                    'yt_privacy_status': base_config.yt_privacy_status,
                    'yt_made_for_kids': base_config.yt_made_for_kids,
                    'yt_tags_extra': base_config.yt_tags_extra,
                    'tt_enabled': base_config.tt_enabled,
                    'tt_publish_mode': base_config.tt_publish_mode,
                }

        return self._config_data

    @property
    def source_dir(self) -> Path:
        """Directorio de videos específico del proyecto."""
        config = self._load_config()
        return config['source_dir']

    @property
    def output_dir(self) -> Path:
        """Directorio de salida específico del proyecto."""
        config = self._load_config()
        return config['output_dir']

    @property
    def report_path(self) -> Path:
        """Archivo de reporte específico del proyecto."""
        config = self._load_config()
        return config['report_path']

    @property
    def sheets_id(self) -> str:
        """ID de Google Sheets específico del proyecto."""
        config = self._load_config()
        return config['sheets_id']

    @property
    def sheets_range(self) -> str:
        """Rango de Google Sheets específico del proyecto."""
        config = self._load_config()
        return config['sheets_range']

    @property
    def metadata_source_type(self) -> str:
        """Tipo de fuente de metadatos."""
        config = self._load_config()
        return config['metadata_source_type']

    @property
    def ordering(self) -> str:
        """Ordenamiento de archivos."""
        config = self._load_config()
        return config['ordering']

    @property
    def group_size(self) -> int:
        """Tamaño de grupo."""
        config = self._load_config()
        return config['group_size']

    @property
    def output_pattern(self) -> str:
        """Patrón de salida."""
        config = self._load_config()
        return config['output_pattern']

    @property
    def timezone(self) -> str:
        """Zona horaria."""
        config = self._load_config()
        return config['timezone']

    @property
    def start_date(self) -> str:
        """Fecha de inicio."""
        config = self._load_config()
        return config['start_date']

    @property
    def times(self) -> str:
        """Horarios."""
        config = self._load_config()
        return config['times']

    @property
    def yt_category_id(self) -> str:
        """ID de categoría de YouTube."""
        config = self._load_config()
        return config['yt_category_id']

    @property
    def yt_privacy_status(self) -> str:
        """Estado de privacidad de YouTube."""
        config = self._load_config()
        return config['yt_privacy_status']

    @property
    def yt_made_for_kids(self) -> bool:
        """Contenido hecho para niños."""
        config = self._load_config()
        return config['yt_made_for_kids']

    @property
    def yt_tags_extra(self) -> str:
        """Tags extra de YouTube."""
        config = self._load_config()
        return config['yt_tags_extra']

    @property
    def tt_enabled(self) -> bool:
        """TikTok habilitado."""
        config = self._load_config()
        return config['tt_enabled']

    @property
    def tt_publish_mode(self) -> str:
        """Modo de publicación de TikTok."""
        config = self._load_config()
        return config['tt_publish_mode']

    @property
    def source_dir(self) -> Path:
        """Directorio de videos específico del proyecto."""
        base_settings = get_settings()
        return base_settings.base_source_dir / self.project_name

    @property
    def output_dir(self) -> Path:
        """Directorio de salida específico del proyecto."""
        base_settings = get_settings()
        return base_settings.base_output_dir / self.project_name

    @property
    def report_path(self) -> Path:
        """Archivo de reporte específico del proyecto."""
        return self.output_dir / "report.json"

    @property
    def sheets_id(self) -> str:
        """ID de Google Sheets específico del proyecto (desde BD o config por defecto)."""
        # TODO: Implementar lógica para obtener desde BD por user_id/channel_id
        # Por ahora retorna el valor por defecto
        return get_settings().default_sheets_id

    @property
    def sheets_range(self) -> str:
        """Rango de Google Sheets específico del proyecto."""
        # TODO: Implementar lógica para obtener desde BD por user_id/channel_id
        # Por ahora retorna el valor por defecto
        return get_settings().default_sheets_range


def get_project_config(user_id: int | None = None, channel_id: str | None = None, project_name: str | None = None, db_session = None) -> ProjectConfig:
    """Obtiene configuración específica para un proyecto/usuario/canal."""
    return ProjectConfig(user_id=user_id, channel_id=channel_id, project_name=project_name, db_session=db_session)