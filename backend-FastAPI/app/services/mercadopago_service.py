import mercadopago
from mercadopago.config import RequestOptions
from mercadopago.resources import Payment
from mercadopago.resources.preference import Preference
from typing import Dict, Any, Optional
from app.core.config import get_settings

settings = get_settings()
from app.db.session import get_db
from app.models.user import User
from app.models.subscription_plan import SubscriptionPlan
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class MercadoPagoService:
    def __init__(self):
        self.sdk = mercadopago.SDK(settings.mp_access_token)
        self.request_options = RequestOptions(
            access_token=settings.mp_access_token
        )

    def create_payment_preference(self, user: User, plan: SubscriptionPlan, db: Session) -> Dict[str, Any]:
        """
        Crea una preferencia de pago para Mercado Pago.
        """
        preference_data = {
            "items": [
                {
                    "title": f"Actualización a plan {plan.display_name}",
                    "quantity": 1,
                    "unit_price": plan.price / 100,  # Asumiendo precio en centavos
                    "currency_id": "COP",  # Moneda colombiana, ajustar según necesidad
                }
            ],
            "payer": {
                "email": user.email,
                "name": user.name,
            },
            "back_urls": {
                "success": f"{settings.base_url}/payment/success",
                "failure": f"{settings.base_url}/payment/failure",
                "pending": f"{settings.base_url}/payment/pending",
            },
            "auto_return": "approved",
            "external_reference": f"user_{user.id}_plan_{plan.id}",
            "notification_url": f"{settings.base_url}/webhooks/mercadopago",
        }

        preference_response = self.sdk.preference().create(preference_data, self.request_options)
        
        if preference_response["status"] == 201:
            return {
                "preference_id": preference_response["response"]["id"],
                "init_point": preference_response["response"]["init_point"],
                "sandbox_init_point": preference_response["response"]["sandbox_init_point"],
            }
        else:
            logger.error(f"Error creando preferencia: {preference_response}")
            raise Exception("Error al crear la preferencia de pago")

    def process_webhook(self, data: Dict[str, Any], db: Session) -> bool:
        """
        Procesa la notificación del webhook de Mercado Pago.
        """
        topic = data.get("topic")
        resource = data.get("resource")

        if topic == "payment":
            payment_id = resource.split("/")[-1]
            payment_info = self.sdk.payment().get(payment_id, self.request_options)
            
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                if payment["status"] == "approved":
                    external_reference = payment.get("external_reference")
                    if external_reference and external_reference.startswith("user_") and "_plan_" in external_reference:
                        try:
                            user_id_str, plan_id_str = external_reference.split("_plan_")
                            user_id = int(user_id_str.split("_")[1])
                            plan_id = int(plan_id_str)
                            
                            # Actualizar el plan del usuario
                            user = db.query(User).filter(User.id == user_id).first()
                            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
                            
                            if user and plan:
                                user.plan_id = plan_id
                                db.commit()
                                logger.info(f"Plan actualizado para usuario {user_id} a plan {plan_id}")
                                return True
                            else:
                                logger.error(f"Usuario o plan no encontrado: user_id={user_id}, plan_id={plan_id}")
                        except ValueError as e:
                            logger.error(f"Error parseando external_reference: {external_reference}, error: {e}")
                    else:
                        logger.error(f"Referencia externa inválida: {external_reference}")
                else:
                    logger.info(f"Pago no aprobado: {payment['status']}")
            else:
                logger.error(f"Error obteniendo pago: {payment_info}")
        
        return False