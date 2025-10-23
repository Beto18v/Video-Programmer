import sys
sys.path.append('.')
from app.core.config import Settings
from sqlalchemy import create_engine, text

settings = Settings()
engine = create_engine(settings.database_url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
    tables = result.fetchall()
    print('Existing tables:')
    for table in tables:
        print(f'  - {table[0]}')