from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from . import Base


def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    picture = Column(String, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), default=2)  # 1=admin, 2=cliente (only 2 roles allowed)
    active_channel_id = Column(String, nullable=True)  # ID of the currently active YouTube channel
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), default=1)  # Default to Free plan
    # Monthly count of videos uploaded by user (resets every billing month)
    uploaded_videos_count = Column(Integer, default=0)
    # Start of the current counting period (month), anchored by card registration date if available
    video_count_period_start = Column(DateTime, nullable=True)
    # Stripe customer identifier (no sensitive card data is stored)
    stripe_customer_id = Column(String, nullable=True, index=True)
    # Date when the user registered a card (used as monthly anchor)
    card_registered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    role = relationship("Role", back_populates="users")
    oauth_tokens = relationship("OAuthToken", back_populates="user")
    project_configs = relationship("ProjectConfig", back_populates="user")
    plan = relationship("SubscriptionPlan", back_populates="users")
    videos = relationship("Video", back_populates="user")

class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, default="google")  # For future extensibility
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_type = Column(String, default="Bearer")
    expires_at = Column(DateTime, nullable=True)
    scope = Column(Text, nullable=True)
    channel_id = Column(String, nullable=True)  # YouTube channel ID
    channel_title = Column(String, nullable=True)  # YouTube channel title
    is_primary = Column(Integer, default=0)  # 1 for primary channel, 0 for additional
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationship back to user
    user = relationship("User", back_populates="oauth_tokens")

class ProjectConfig(Base):
    """Configuración específica por proyecto/usuario/canal."""
    __tablename__ = "project_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel_id = Column(String, nullable=True)  # Null para configuración global del usuario
    project_name = Column(String, nullable=True)  # Nombre del proyecto

    # Directorios específicos
    source_dir = Column(String, nullable=True)
    output_dir = Column(String, nullable=True)
    report_path = Column(String, nullable=True)

    # Configuración de metadatos
    metadata_source_type = Column(String, default="sheets")  # sheets|csv|json
    sheets_id = Column(String, nullable=True)
    sheets_range = Column(String, nullable=True)
    csv_path = Column(String, nullable=True)
    json_path = Column(String, nullable=True)

    # Configuración de procesamiento
    ordering = Column(String, default="name")  # name|date
    group_size = Column(Integer, default=3)
    output_pattern = Column(String, default="Semana{week:02d}_Dia{day:02d}.mp4")

    # Configuración temporal
    timezone = Column(String, default="America/Bogota")
    start_date = Column(String, default="2025-10-13")
    times = Column(String, default="10:00,14:00,18:00")  # Separados por coma

    # Configuración YouTube
    yt_category_id = Column(String, default="22")
    yt_privacy_status = Column(String, default="private")
    yt_made_for_kids = Column(Boolean, default=False)
    yt_tags_extra = Column(String, nullable=True)  # Separados por coma

    # Configuración TikTok
    tt_enabled = Column(Boolean, default=False)
    tt_client_key = Column(String, nullable=True)
    tt_client_secret = Column(String, nullable=True)
    tt_publish_mode = Column(String, default="auto")

    # Metadata
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationship back to user
    user = relationship("User", back_populates="project_configs")
