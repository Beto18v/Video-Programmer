from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pytz import timezone


class Settings(BaseSettings):
    # Directorios
    source_dir: Path = Field(default=Path("D:\\Proyects\\Religion\\videos"))
    output_dir: Path = Field(default=Path("D:\\Proyects\\Religion\\salida"))

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

    # Configuración específica por canal para Google Sheets
    sheets_id_religion: str = Field(default="1vBXtJuJR_faNGFBMSqW9U_1izibSQrrDNZLMtb5ViqE")
    sheets_range_religion: str = Field(default="1102627582!I2:L")  # gid=1102627582, columnas I(título), K(hashtags_tiktok), L(hashtags_youtube)

    sheets_id_phrases: str = Field(default="1vBXtJuJR_faNGFBMSqW9U_1izibSQrrDNZLMtb5ViqE")
    sheets_range_phrases: str = Field(default="929149575!C2:G")  # gid=929149575, columnas C(título), F(hashtags_tiktok), G(hashtags_youtube)

    # Google Service Account para Sheets API
    google_service_account_file: Path | None = Field(default=None)

    # Configuración temporal
    timezone: str = Field(default="America/Bogota")
    start_date: str = Field(default="2025-10-13")
    times: str | list[str] = Field(default="10:00,14:00,18:00")

    # YouTube
    yt_client_id: str | None = Field(default=None)
    yt_client_secret: str | None = Field(default=None)
    yt_redirect_uri: str = Field(default="http://localhost:8000/oauth2/callback/youtube")
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
    report_path: Path = Field(default=Path("D:\\Proyects\\Religion\\salida\\report.json"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    @model_validator(mode="after")
    def convert_strings_to_lists(self):
        if isinstance(self.times, str):
            self.times = [item.strip() for item in self.times.split(",") if item.strip()]
        if isinstance(self.yt_tags_extra, str):
            self.yt_tags_extra = [item.strip() for item in self.yt_tags_extra.split(",") if item.strip()]
        return self

    @field_validator("source_dir", "output_dir", "csv_path", "json_path", "report_path", mode="before")
    @classmethod
    def validate_paths(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return Path(v)
        return v

    @field_validator("source_dir", "output_dir")
    @classmethod
    def validate_directories(cls, v):
        if not v.exists():
            raise ValueError(f"El directorio {v} no existe")
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