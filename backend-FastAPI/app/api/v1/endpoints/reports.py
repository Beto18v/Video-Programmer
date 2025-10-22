"""
Report endpoints for publication tracking.

This module provides endpoints to retrieve publication reports and logs.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from loguru import logger

from app.core.config import Settings

router = APIRouter()

class ReportResponse(BaseModel):
    """Response model for publication reports."""
    items: List[Dict[str, Any]]

@router.get("/report", response_model=ReportResponse)
def get_report() -> ReportResponse:
    """Get the publication report."""
    try:
        config = Settings()
        report_path = config.report_path
        if report_path.exists():
            import json
            with open(report_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return ReportResponse(items=data.get("items", []))
        else:
            return ReportResponse(items=[])

    except Exception as e:
        logger.error(f"Error reading report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read report: {str(e)}"
        )