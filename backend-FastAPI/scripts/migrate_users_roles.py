#!/usr/bin/env python3
"""
Script to migrate existing users table to add role_id column.
"""

import sys
sys.path.append('.')

from app.core.config import Settings
from sqlalchemy import create_engine, text

settings = Settings()
engine = create_engine(settings.database_url)

with engine.connect() as conn:
    try:
        # Add role_id column to users table
        print("Adding role_id column to users table...")
        conn.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id) DEFAULT 2;"))
        conn.commit()
        print("✅ Column role_id added successfully")

        # Update existing users to have role_id = 2 (cliente)
        print("Updating existing users with role_id = 2...")
        result = conn.execute(text("UPDATE users SET role_id = 2 WHERE role_id IS NULL;"))
        conn.commit()
        print(f"✅ Updated {result.rowcount} users")

        # Verify
        result = conn.execute(text("SELECT id, google_id, email, role_id FROM users LIMIT 5;"))
        users = result.fetchall()
        print('\nFirst 5 users with role_id:')
        for user in users:
            print(f'  - ID: {user[0]}, Email: {user[2]}, Role_ID: {user[3]}')

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()