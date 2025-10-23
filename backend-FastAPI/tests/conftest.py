import os

# Set test database before importing anything from the app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base


@pytest.fixture(scope="session", autouse=True)
def set_test_database():
    """Set up test database using SQLite in memory."""
    # Create test database engine (in-memory)
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    yield

    # No cleanup needed for in-memory database
    # The database will be automatically discarded when the process ends


@pytest.fixture
def db_session():
    """Provide a database session for tests."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()