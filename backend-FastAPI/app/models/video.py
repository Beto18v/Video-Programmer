from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from . import Base


def utcnow():
    return datetime.now(timezone.utc)


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    youtube_video_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON string of tags
    category_id = Column(String, nullable=True)
    privacy_status = Column(String, default="private")
    made_for_kids = Column(Boolean, default=False)
    scheduled_at = Column(DateTime, nullable=True)
    uploaded_at = Column(DateTime, default=utcnow)
    youtube_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, scheduled, published, failed

    # Relationships
    user = relationship("User", back_populates="videos")