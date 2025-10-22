from fastapi import APIRouter
from .endpoints import videos, auth, reports

api_router = APIRouter()
api_router.include_router(videos.router, prefix="", tags=["videos"])
api_router.include_router(auth.router, prefix="", tags=["auth"])
api_router.include_router(reports.router, prefix="", tags=["reports"])