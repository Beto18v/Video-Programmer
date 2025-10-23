from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from app.db.session import get_db
from app.core.config import get_settings

settings = get_settings()
from app.services.mercadopago_service import MercadoPagoService
from app.models.user import User
from app.models.subscription_plan import SubscriptionPlan

router = APIRouter()

class CreatePaymentRequest(BaseModel):
    plan_id: int
    user_id: int  # Para este ejemplo, requerimos user_id explícitamente

class PaymentResponse(BaseModel):
    preference_id: str
    init_point: str
    sandbox_init_point: str

@router.post("/create_preference", response_model=PaymentResponse)
async def create_payment_preference(
    request: CreatePaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Crea una preferencia de pago para actualizar el plan del usuario.
    """
    # Obtener usuario
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar que el plan existe
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == request.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    # Verificar que no sea el mismo plan
    if user.plan_id == request.plan_id:
        raise HTTPException(status_code=400, detail="Ya tienes este plan")
    
    # Crear preferencia de pago
    mp_service = MercadoPagoService()
    try:
        preference = mp_service.create_payment_preference(user, plan, db)
        return PaymentResponse(**preference)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear preferencia: {str(e)}")

@router.post("/webhooks/mercadopago")
async def mercadopago_webhook(
    data: dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Webhook para recibir notificaciones de Mercado Pago.
    """
    mp_service = MercadoPagoService()
    try:
        success = mp_service.process_webhook(data, db)
        if success:
            return {"status": "success"}
        else:
            return {"status": "ignored"}
    except Exception:
        # Loggear el error
        raise HTTPException(status_code=500, detail="Error procesando webhook")