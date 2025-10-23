from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base
from app.models.user import User
from app.services.plan_service import PlanService


def make_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def test_free_plan_limit_and_description():
    db = make_session()
    try:
        svc = PlanService(db)
        svc.create_default_plans()
        free = svc.get_plan_by_name("free")
        assert free is not None
        assert free.max_videos == 5
        assert "5 videos" in (free.description or "")
    finally:
        db.close()


def test_monthly_counter_resets_with_user_creation_anchor():
    db = make_session()
    try:
        svc = PlanService(db)
        svc.create_default_plans()
        free = svc.get_plan_by_name("free")

        # User created on Jan 15, 2025 at 10:00 UTC
        created_at = datetime(2025, 1, 15, 10, 0, 0)
        user = User(email="u1@example.com", google_id="g1", name="U1", created_at=created_at, plan_id=free.id)
        db.add(user)
        db.commit()
        db.refresh(user)

        # Now = Jan 20: still same cycle (starts Jan 15)
        svc._utcnow = lambda: datetime(2025, 1, 20, 10, 0, 0)  # type: ignore
        svc.ensure_user_monthly_counter(user)
        assert user.video_count_period_start == created_at

        # Simulate 5 uploads -> reaches cap
        for _ in range(5):
            assert svc.can_user_upload_video(user) is True
            svc.increment_user_video_count(user)
        assert svc.can_user_upload_video(user) is False

        # Move to Feb 16 2025 00:00 UTC -> new cycle (Feb 15 anchor)
        svc._utcnow = lambda: datetime(2025, 2, 16, 0, 0, 0)  # type: ignore
        svc.ensure_user_monthly_counter(user)
        assert user.uploaded_videos_count == 0
        assert user.video_count_period_start == datetime(2025, 2, 15, 10, 0, 0)
        assert svc.can_user_upload_video(user) is True
    finally:
        db.close()


def test_reanchor_on_card_registration():
    db = make_session()
    try:
        svc = PlanService(db)
        svc.create_default_plans()
        free = svc.get_plan_by_name("free")

        # User created Jan 1
        created_at = datetime(2025, 1, 1, 9, 0, 0)
        user = User(email="u2@example.com", google_id="g2", name="U2", created_at=created_at, plan_id=free.id)
        db.add(user)
        db.commit()
        db.refresh(user)

        # Simulate some usage in current cycle (before card registration)
        svc._utcnow = lambda: datetime(2025, 3, 1, 10, 0, 0)  # type: ignore
        svc.ensure_user_monthly_counter(user)
        svc.increment_user_video_count(user)
        assert user.uploaded_videos_count == 1

        # Card registered Mar 10 -> anchor changes to Mar 10; counter resets
        svc._utcnow = lambda: datetime(2025, 3, 10, 12, 0, 0)  # type: ignore
        svc.set_card_registered(user, mercado_pago_customer_id="cus_test", registered_at=datetime(2025, 3, 10, 12, 0, 0))
        assert user.mercado_pago_customer_id == "cus_test"
        assert user.payment_registered_at == datetime(2025, 3, 10, 12, 0, 0)
        assert user.uploaded_videos_count == 0
        assert user.video_count_period_start == datetime(2025, 3, 10, 12, 0, 0)

        # Before Apr 10 -> same cycle
        svc._utcnow = lambda: datetime(2025, 4, 9, 11, 0, 0)  # type: ignore
        svc.ensure_user_monthly_counter(user)
        assert user.video_count_period_start == datetime(2025, 3, 10, 12, 0, 0)

        # After Apr 10 -> new cycle starts (Apr 10 @ 12:00)
        svc._utcnow = lambda: datetime(2025, 4, 11, 12, 0, 0)  # type: ignore
        svc.ensure_user_monthly_counter(user)
        assert user.video_count_period_start == datetime(2025, 4, 10, 12, 0, 0)
        assert user.uploaded_videos_count == 0
    finally:
        db.close()

