from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import logging
import calendar

from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User
from fastapi import HTTPException


logger = logging.getLogger(__name__)


class PlanService:
    def __init__(self, db: Session):
        self.db = db

    # --- Time helpers (test-friendly) ---
    def _utcnow(self) -> datetime:
        return datetime.now(timezone.utc)

    def _get_billing_anchor(self, user: User) -> datetime:
        """Anchor for monthly cycles: payment_registered_at if present, else created_at."""
        return user.payment_registered_at or user.created_at

    def _add_months(self, dt: datetime, months: int) -> datetime:
        """Add months to dt, clamping the day to the last day of the resulting month."""
        year = dt.year + (dt.month - 1 + months) // 12
        month = (dt.month - 1 + months) % 12 + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        return dt.replace(year=year, month=month, day=day)

    def _current_cycle_start(self, anchor: datetime, now: datetime) -> datetime:
        """Compute the start of the current monthly cycle anchored to the given anchor datetime.
        The cycle starts each month on the same day and time as the anchor (or last day if shorter).
        """
        if now < anchor:
            return anchor
        # Find k such that anchor + k months <= now < anchor + (k+1) months
        low, high = 0, 2400
        while low < high:
            mid = (low + high + 1) // 2
            candidate = self._add_months(anchor, mid)
            if candidate <= now:
                low = mid
            else:
                high = mid - 1
        return self._add_months(anchor, low)

    def ensure_user_monthly_counter(self, user: User) -> None:
        """Ensure user's uploaded_videos_count reflects the current monthly cycle.
        If cycle changed, reset count and update period start.
        """
        if not user:
            return
        now = self._utcnow()
        anchor = self._get_billing_anchor(user) or now
        current_cycle_start = self._current_cycle_start(anchor, now)
        if user.video_count_period_start is None:
            user.video_count_period_start = current_cycle_start
            # If starting in a later cycle than creation, ensure count is 0
            if user.created_at and current_cycle_start > user.created_at:
                user.uploaded_videos_count = 0
            self.db.commit()
            return
        if user.video_count_period_start != current_cycle_start:
            user.video_count_period_start = current_cycle_start
            user.uploaded_videos_count = 0
            self.db.commit()

    # --- Plan management ---
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
        """Create or sync default plans"""
        plans_data = [
            {
                "name": "free",
                "display_name": "Free",
                "description": "Plan gratuito con límite de 5 videos por mes",
                "max_videos": 5,
                "price": 0,
            },
            {
                "name": "pro",
                "display_name": "Pro",
                "description": "Plan profesional con límite de 100 videos por mes",
                "max_videos": 100,
                "price": 990,  # $9.90
            },
            {
                "name": "premium",
                "display_name": "Premium",
                "description": "Plan premium con videos ilimitados (renovación mensual)",
                "max_videos": 0,  # 0 = unlimited
                "price": 1990,  # $19.90
            },
        ]

        for plan_data in plans_data:
            existing_plan = self.get_plan_by_name(plan_data["name"])
            if not existing_plan:
                plan = SubscriptionPlan(**plan_data)
                self.db.add(plan)
                logger.info(f"Created default plan: {plan_data['name']}")
            else:
                updated = False
                if existing_plan.description != plan_data["description"]:
                    existing_plan.description = plan_data["description"]
                    updated = True
                if existing_plan.max_videos != plan_data["max_videos"]:
                    existing_plan.max_videos = plan_data["max_videos"]
                    updated = True
                if existing_plan.price != plan_data["price"]:
                    existing_plan.price = plan_data["price"]
                    updated = True
                if updated:
                    logger.info(f"Updated plan: {plan_data['name']}")

        self.db.commit()

    # --- User-plan logic ---
    def can_user_upload_video(self, user: User) -> bool:
        """Check if user can upload more videos based on their plan (monthly)."""
        self.ensure_user_monthly_counter(user)
        if not user.plan:
            # Default to free plan if no plan assigned
            free_plan = self.get_plan_by_name("free")
            if free_plan:
                user.plan = free_plan
                self.db.commit()
            else:
                return False

        # Unlimited plan
        if user.plan.max_videos == 0:
            return True

        return user.uploaded_videos_count < user.plan.max_videos

    def increment_user_video_count(self, user: User) -> None:
        """Increment the user's monthly uploaded videos count."""
        self.ensure_user_monthly_counter(user)
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

    def set_card_registered(self, user: User, mercado_pago_customer_id: str, registered_at: Optional[datetime] = None) -> User:
        """Register a payment method and set MercadoPago customer ID; don't store sensitive payment data.
        Resets the monthly cycle anchor to the registration date and resets the counter.
        """
        user.mercado_pago_customer_id = mercado_pago_customer_id
        user.payment_registered_at = registered_at or self._utcnow()
        new_cycle_start = self._current_cycle_start(user.payment_registered_at, self._utcnow())
        user.video_count_period_start = new_cycle_start
        user.uploaded_videos_count = 0
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_plan_info(self, user: User) -> dict:
        """Get detailed plan information for a user"""
        self.ensure_user_monthly_counter(user)
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
            "remaining_videos": plan.max_videos - user.uploaded_videos_count if plan.max_videos > 0 else float("inf"),
            "can_upload": self.can_user_upload_video(user),
            "price": plan.price,
            "period_start": user.video_count_period_start.isoformat() if user.video_count_period_start else None,
        }

