from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # Free, Pro, Premium
    display_name = Column(String)  # Nombre para mostrar
    description = Column(Text, nullable=True)
    max_videos = Column(Integer, default=0)  # 0 = unlimited
    price = Column(Integer, default=0)  # Price in cents
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="plan")

    def __repr__(self):
        return f"<SubscriptionPlan(name='{self.name}', max_videos={self.max_videos})>"