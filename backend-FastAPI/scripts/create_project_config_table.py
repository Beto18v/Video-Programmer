"""Migration script to create ProjectConfig table"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

# Import the database URL from config
from app.core.config import settings

Base = declarative_base()

class ProjectConfig(Base):
    """Project configuration model for database migration"""
    __tablename__ = "project_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    channel_id = Column(String(100), nullable=False, index=True)

    # Project info
    project_name = Column(String(255), nullable=False)

    # Directory paths
    source_dir = Column(String(500), nullable=False)
    output_dir = Column(String(500), nullable=False)
    report_path = Column(String(500), nullable=False)

    # Metadata source configuration
    metadata_source_type = Column(String(50), default="sheets")  # sheets, csv, json
    sheets_id = Column(String(100))
    sheets_range = Column(String(100))
    csv_path = Column(String(500))
    json_path = Column(String(500))

    # Grouping configuration
    ordering = Column(String(50), default="name")  # name, date
    group_size = Column(Integer, default=3)

    # Output configuration
    output_pattern = Column(String(255), default="Semana{week:02d}_Dia{day:02d}.mp4")
    timezone = Column(String(50), default="America/Bogota")
    start_date = Column(String(20), default="2025-10-13")
    times = Column(String(255), default="10:00,14:00,18:00")

    # YouTube configuration
    yt_category_id = Column(String(10), default="22")
    yt_privacy_status = Column(String(20), default="private")
    yt_made_for_kids = Column(Boolean, default=False)
    yt_tags_extra = Column(Text)

    # TikTok configuration
    tt_enabled = Column(Boolean, default=False)
    tt_client_key = Column(String(255))
    tt_client_secret = Column(String(255))
    tt_publish_mode = Column(String(50), default="auto")  # auto, manual

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def create_project_config_table():
    """Create the project_configs table"""
    engine = create_engine(settings.database_url)

    # Create the table
    Base.metadata.create_all(engine)

    print("✅ ProjectConfig table created successfully!")

    # Create a session to verify
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check if table exists by trying to query it
        result = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='project_configs';")
        if result.fetchone():
            print("✅ Table 'project_configs' verified in database")
        else:
            print("❌ Table 'project_configs' not found in database")
    except Exception as e:
        print(f"⚠️  Could not verify table creation: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating ProjectConfig table...")
    create_project_config_table()
    print("🎉 Migration completed!")