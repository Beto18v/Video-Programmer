#!/usr/bin/env python3
"""
Script to initialize subscription plans in the database.
This script creates the default plans: Free, Pro, and Premium.
"""

import sys
sys.path.append('.')

from app.core.config import Settings
from app.models import Base
from app.models.subscription_plan import SubscriptionPlan
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

settings = Settings()
engine = create_engine(settings.database_url)

# Create tables
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Check if plans already exist
    existing_plans = db.query(SubscriptionPlan).count()
    if existing_plans > 0:
        print("Subscription plans already exist in the database.")
    else:
        # Create default plans
        free_plan = SubscriptionPlan(
            name="free",
            display_name="Free",
            description="Plan gratuito con límite de 10 videos",
            max_videos=10,
            price=0
        )
        pro_plan = SubscriptionPlan(
            name="pro",
            display_name="Pro",
            description="Plan profesional con límite de 100 videos",
            max_videos=100,
            price=990  # $9.90
        )
        premium_plan = SubscriptionPlan(
            name="premium",
            display_name="Premium",
            description="Plan premium con videos ilimitados",
            max_videos=0,  # 0 = unlimited
            price=1990  # $19.90
        )

        db.add(free_plan)
        db.add(pro_plan)
        db.add(premium_plan)
        db.commit()
        print("✅ Subscription plans created successfully:")
        print("  - Free: 10 videos (Free)")
        print("  - Pro: 100 videos ($9.90)")
        print("  - Premium: Unlimited videos ($19.90)")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()