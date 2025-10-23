"""
Basic MercadoPago integration example.

Notes:
- Do NOT store raw payment data in your database.
- Use MercadoPago SDK on the frontend to collect payment data and create a Payment.
- On the backend, use the Payment ID and Customer ID only.
"""

from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import User
from app.services.plan_service import PlanService


def create_or_get_customer_for_user(db: Session, user: User, mercado_pago_access_token: str) -> str:
    """Create a MercadoPago customer for the user if none exists, and return the customer ID.

    This stores only the `mercado_pago_customer_id` on the user model.
    """
    if user.mercado_pago_customer_id:
        return user.mercado_pago_customer_id

    # Lazy import to avoid hard dependency in environments without MercadoPago installed
    import mercadopago  # type: ignore

    sdk = mercadopago.SDK(mercado_pago_access_token)

    customer_data = {
        "email": user.email,
        "first_name": user.name.split()[0] if user.name else user.email.split('@')[0],
        "last_name": " ".join(user.name.split()[1:]) if user.name and len(user.name.split()) > 1 else "",
        "identification": {
            "type": "email",
            "number": user.email
        },
        "metadata": {"user_id": str(user.id)},
    }

    customer_response = sdk.customer().create(customer_data)
    customer = customer_response["response"]

    user.mercado_pago_customer_id = customer["id"]
    db.commit()
    db.refresh(user)
    return user.mercado_pago_customer_id


def attach_payment_method(
    db: Session,
    user: User,
    payment_method_id: str,
    mercado_pago_access_token: str,
    registered_at: Optional[datetime] = None,
) -> User:
    """Attach a PaymentMethod to the user's customer and set the monthly anchor.

    Frontend should provide a `payment_method_id` (created with MercadoPago SDK).
    We set `payment_registered_at` and reset the monthly counter anchor via PlanService.
    """
    import mercadopago  # type: ignore

    sdk = mercadopago.SDK(mercado_pago_access_token)

    # Ensure customer exists
    if not user.mercado_pago_customer_id:
        create_or_get_customer_for_user(db, user, mercado_pago_access_token)

    # Create card token for the customer
    card_data = {
        "customer_id": user.mercado_pago_customer_id,
        "token": payment_method_id,
    }

    card_response = sdk.card().create(user.mercado_pago_customer_id, card_data)
    card = card_response["response"]

    # Update user billing anchor and reset monthly counter
    PlanService(db).set_card_registered(user, user.mercado_pago_customer_id, registered_at)
    return user

