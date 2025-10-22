from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import httpx
import json
from typing import List, Dict, Any
from loguru import logger

from app.core.config import Settings

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Base URL for internal API calls
BASE_URL = "http://127.0.0.1:8000"

@router.get("/panel", response_class=HTMLResponse)
async def panel_home(request: Request):
    """Main panel page - select channel."""
    channels = ["religion", "phrases", "beto"]  # Predefined channels
    return templates.TemplateResponse("index.html", {"request": request, "channels": channels})

@router.get("/panel/channel/{channel}", response_class=HTMLResponse)
async def select_channel(request: Request, channel: str):
    """Show videos in selected channel."""
    try:
        # Check if token exists for this channel
        token_file = Path(f".tokens/{channel}/token.json")
        if not token_file.exists():
            # Redirect to OAuth authorization
            return RedirectResponse(f"/oauth2/authorize/youtube/{channel}", status_code=302)

        # Get videos from storage/videos/{channel}/
        videos_dir = Path(f"storage/videos/{channel}")
        if not videos_dir.exists():
            videos = []
        else:
            videos = [f.name for f in videos_dir.iterdir() if f.is_file() and f.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']]

        return templates.TemplateResponse("channel.html", {
            "request": request,
            "channel": channel,
            "videos": videos
        })
    except Exception as e:
        logger.error(f"Error loading channel {channel}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/panel/plan/{channel}", response_class=HTMLResponse)
async def create_plan(request: Request, channel: str, group_size: int = Form(3)):
    """Create plan for the channel."""
    try:
        source_dir = f"storage/videos/{channel}"
        output_dir = f"storage/salida/{channel}"

        # Call the /plan endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/plan", json={
                "source_dir": source_dir,
                "output_dir": output_dir,
                "ordering": "name",
                "group_size": group_size,
                "output_pattern": "Semana{{week|02}}_Dia{{day|02}}.mp4"
            })
            response.raise_for_status()
            plan_data = response.json()

        return templates.TemplateResponse("plan.html", {
            "request": request,
            "channel": channel,
            "plan": plan_data["plan"],
            "slots": plan_data["slots"],
            "metadata_preview": plan_data["metadata_preview"]
        })
    except Exception as e:
        logger.error(f"Error creating plan for {channel}: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/panel/group/{channel}", response_class=HTMLResponse)
async def group_videos(request: Request, channel: str):
    """Agrupa videos y redirige a la pantalla de salida para editar metadatos y publicar."""
    try:
        form = await request.form()
        plan_json_value = form.get("plan_json")
        if not isinstance(plan_json_value, str):
            raise ValueError("Invalid plan_json")
        plan = json.loads(plan_json_value)
        force = form.get("force") == "true"

        # Call the /group endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/group", json={
                "plan": plan,
                "force": force
            })
            response.raise_for_status()
            # group_data = response.json()  # No se usa, redirigimos

        # Redirigir a la pantalla de salida para editar metadatos y publicar
        return RedirectResponse(f"/panel/salida/{channel}", status_code=303)
    except Exception as e:
        logger.error(f"Error grouping videos for {channel}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/panel/publish/{channel}", response_class=HTMLResponse)
async def publish_videos(request: Request, channel: str, slots_json: str = Form(...), use_sheets: bool = Form(True)):
    """Publish videos to YouTube."""
    try:
        slots = json.loads(slots_json)

        # Get outputs from plan (assuming plan is stored or passed)
        # For simplicity, list files in output_dir
        output_dir = Path(f"storage/salida/{channel}")
        outputs = []
        if output_dir.exists():
            for i, f in enumerate(sorted(output_dir.iterdir()), 1):
                if f.is_file() and f.suffix.lower() == '.mp4':
                    outputs.append({"path": str(f), "index": i})

        # Call the /publish/youtube endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/publish/youtube", json={
                "channel": channel,
                "outputs": outputs,
                "slots": slots,
                "use_sheets": use_sheets,
                "reupload": False
            })
            response.raise_for_status()
            publish_data = response.json()

        return templates.TemplateResponse("publish.html", {
            "request": request,
            "channel": channel,
            "results": publish_data["results"]
        })
    except Exception as e:
        logger.error(f"Error publishing videos for {channel}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/panel/status", response_class=HTMLResponse)
async def view_status(request: Request):
    """View publication status and logs."""
    try:
        # Call the /report endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/report")
            response.raise_for_status()
            report_data = response.json()

        return templates.TemplateResponse("status.html", {
            "request": request,
            "report": report_data["items"]
        })
    except Exception as e:
        logger.error(f"Error loading status: {e}")
        raise HTTPException(status_code=500, detail=str(e))