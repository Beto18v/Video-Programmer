from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class PlanService:
    def __init__(self, db: Session):
        self.db = db

    def get_plan_by_id(self, plan_id: int) -> Optional[SubscriptionPlan]:
        """Get a plan by ID"""
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()

    def get_plan_by_name(self, name: str) -> Optional[SubscriptionPlan]:
        """Get a plan by name"""
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.name == name).first()

    def get_all_plans(self) -> List[SubscriptionPlan]:
        """Get all active plans"""
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

    def create_default_plans(self):
        """Create default plans if they don't exist"""
        plans_data = [
            {
                "name": "free",
                "display_name": "Free",
                "description": "Plan gratuito con límite de 10 videos",
                "max_videos": 10,
                "price": 0
            },
            {
                "name": "pro",
                "display_name": "Pro",
                "description": "Plan profesional con límite de 100 videos",
                "max_videos": 100,
                "price": 990  # $9.90
            },
            {
                "name": "premium",
                "display_name": "Premium",
                "description": "Plan premium con videos ilimitados",
                "max_videos": 0,  # 0 = unlimited
                "price": 1990  # $19.90
            }
        ]

        for plan_data in plans_data:
            existing_plan = self.get_plan_by_name(plan_data["name"])
            if not existing_plan:
                plan = SubscriptionPlan(**plan_data)
                self.db.add(plan)
                logger.info(f"Created default plan: {plan_data['name']}")

        self.db.commit()

    def can_user_upload_video(self, user: User) -> bool:
        """Check if user can upload more videos based on their plan"""
        if not user.plan:
            # Default to free plan if no plan assigned
            free_plan = self.get_plan_by_name("free")
            if free_plan:
                user.plan = free_plan
                self.db.commit()
            else:
                return False

        # Check if plan allows unlimited videos
        if user.plan.max_videos == 0:
            return True

        # Check current usage against limit
        return user.uploaded_videos_count < user.plan.max_videos

    def increment_user_video_count(self, user: User) -> None:
        """Increment the user's uploaded videos count"""
        user.uploaded_videos_count += 1
        self.db.commit()

    def update_user_plan(self, user: User, plan_id: int) -> User:
        """Update user's subscription plan"""
        new_plan = self.get_plan_by_id(plan_id)
        if not new_plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        if not new_plan.is_active:
            raise HTTPException(status_code=400, detail="Plan is not active")

        user.plan_id = plan_id
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_plan_info(self, user: User) -> dict:
        """Get detailed plan information for a user"""
        if not user.plan:
            # Assign default plan if none
            free_plan = self.get_plan_by_name("free")
            if free_plan:
                user.plan = free_plan
                user.plan_id = free_plan.id
                self.db.commit()

        plan = user.plan
        return {
            "plan_id": plan.id,
            "plan_name": plan.name,
            "display_name": plan.display_name,
            "description": plan.description,
            "max_videos": plan.max_videos,
            "current_videos": user.uploaded_videos_count,
            "remaining_videos": plan.max_videos - user.uploaded_videos_count if plan.max_videos > 0 else float('inf'),
            "can_upload": self.can_user_upload_video(user),
            "price": plan.price
        }