"""
Basic Stripe integration example.

Notes:
- Do NOT store raw card data in your database.
- Use Stripe.js/Elements on the frontend to collect card data and create a PaymentMethod.
- On the backend, use the PaymentMethod ID and Customer ID only.
"""

from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import User
from app.services.plan_service import PlanService


def create_or_get_customer_for_user(db: Session, user: User, stripe_api_key: str) -> str:
    """Create a Stripe customer for the user if none exists, and return the customer ID.

    This stores only the `stripe_customer_id` on the user model.
    """
    if user.stripe_customer_id:
        return user.stripe_customer_id

    # Lazy import to avoid hard dependency in environments without Stripe installed
    import stripe  # type: ignore

    stripe.api_key = stripe_api_key
    customer = stripe.Customer.create(
        email=user.email,
        name=user.name or user.email,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer["id"]
    db.commit()
    db.refresh(user)
    return user.stripe_customer_id


def attach_payment_method(
    db: Session,
    user: User,
    payment_method_id: str,
    stripe_api_key: str,
    registered_at: Optional[datetime] = None,
) -> User:
    """Attach a PaymentMethod to the user's customer and set the monthly anchor.

    Frontend should provide a `payment_method_id` (created with Stripe Elements).
    We set `card_registered_at` and reset the monthly counter anchor via PlanService.
    """
    import stripe  # type: ignore

    stripe.api_key = stripe_api_key

    # Ensure customer exists
    if not user.stripe_customer_id:
        create_or_get_customer_for_user(db, user, stripe_api_key)

    # Attach payment method to customer
    stripe.PaymentMethod.attach(
        payment_method_id,
        customer=user.stripe_customer_id,
    )
    # Optionally set as default payment method
    stripe.Customer.modify(
        user.stripe_customer_id,
        invoice_settings={"default_payment_method": payment_method_id},
    )

    # Update user billing anchor and reset monthly counter
    PlanService(db).set_card_registered(user, user.stripe_customer_id, registered_at)
    return user

