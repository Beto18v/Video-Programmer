import sys
sys.path.append('.')
from app.core.config import Settings
from app.models.user import ProjectConfig
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

settings = Settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Try to create a simple config
    config = ProjectConfig(
        user_id=1,
        project_name="Test Project",
        source_dir="D:\\Videos",
        output_dir="D:\\Output"
    )
    db.add(config)
    db.commit()
    print("✅ Config created successfully")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()