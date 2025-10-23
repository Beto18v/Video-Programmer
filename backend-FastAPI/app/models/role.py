from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from . import Base


def utcnow():
    return datetime.now(timezone.utc)

class Role(Base):
    """
    Role model for the Video Programmer system.
    This system supports exactly 2 roles:
    - admin (id=1): Administrator with full access
    - cliente (id=2): Client with limited access
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # Only 'admin' and 'cliente' allowed
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationship
    users = relationship("User", back_populates="role")

    def __str__(self):
        return f"Role(id={self.id}, name='{self.name}')"