#!/usr/bin/env python3
"""
Script to initialize roles in the database.
This script creates exactly 2 roles: ADMIN and CLIENT.
"""

import sys
sys.path.append('.')

from app.core.config import Settings
from app.core.roles import ADMIN_ROLE_ID, ADMIN_ROLE_NAME, CLIENT_ROLE_ID, CLIENT_ROLE_NAME
from app.models.role import Role
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

settings = Settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Check if roles already exist
    existing_roles = db.query(Role).count()
    if existing_roles > 0:
        print("Roles already exist in the database.")
    else:
        # Create exactly 2 roles: ADMIN and CLIENT
        admin_role = Role(
            id=ADMIN_ROLE_ID,
            name=ADMIN_ROLE_NAME,
            description="Administrator with full access"
        )
        cliente_role = Role(
            id=CLIENT_ROLE_ID,
            name=CLIENT_ROLE_NAME,
            description="Client with limited access"
        )

        db.add(admin_role)
        db.add(cliente_role)
        db.commit()
        print("✅ Roles created successfully: ADMIN (id=1), CLIENT (id=2)")
        print("Note: This system supports exactly 2 roles as defined in app.core.roles")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()