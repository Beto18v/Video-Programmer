from fastapi import APIRouter, Request, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import httpx
import json
from loguru import logger

from app.services.metadata_service import GoogleSheetsMetadataService

router = APIRouter()
templates = Jinja2Templates(directory="templates")

BASE_URL = "http://127.0.0.1:8000"

@router.get("/panel/salida/{channel}", response_class=HTMLResponse)
async def salida_files(request: Request, channel: str):
    """Mostrar archivos en storage/salida/{channel} y formulario de subida."""
    salida_dir = Path(f"storage/salida/{channel}")
    files = []
    if salida_dir.exists():
        files = [f.name for f in salida_dir.iterdir() if f.is_file() and f.suffix.lower() == '.mp4']
    return templates.TemplateResponse("salida.html", {"request": request, "channel": channel, "files": files})

@router.post("/panel/salida/{channel}/upload", response_class=HTMLResponse)
async def upload_file(request: Request, channel: str, file: UploadFile = File(...)):
    """Subir archivo manualmente a storage/salida/{channel}."""
    if not file.filename:
        return RedirectResponse(f"/panel/salida/{channel}", status_code=303)
    salida_dir = Path(f"storage/salida/{channel}")
    salida_dir.mkdir(parents=True, exist_ok=True)
    dest = salida_dir / file.filename
    with dest.open("wb") as f:
        f.write(await file.read())
    return RedirectResponse(f"/panel/salida/{channel}", status_code=303)

@router.get("/panel/publish/{channel}/edit", response_class=HTMLResponse)
async def edit_metadata(request: Request, channel: str):
    """Pantalla para editar metadatos y programar publicación de todos los archivos en salida."""
    salida_dir = Path(f"storage/salida/{channel}")
    files = []
    if salida_dir.exists():
        files = [f for f in salida_dir.iterdir() if f.is_file() and f.suffix.lower() == '.mp4']

    # Cargar metadatos desde Google Sheets si el canal está soportado
    metadata = []
    if channel in ["religion", "phrases"]:
        try:
            sheets_service = GoogleSheetsMetadataService(channel)
            sheets_metadata = sheets_service.get_metadata_for_outputs(len(files))

            for idx, f in enumerate(sorted(files)):
                if idx < len(sheets_metadata):
                    sheet_data = sheets_metadata[idx]
                    metadata.append({
                        "filename": f.name,
                        "title": sheet_data.get("title", f"Video {idx+1}"),
                        "description": sheet_data.get("description", ""),
                        "hashtags": ",".join(sheet_data.get("hashtags", [])),
                        "hashtags_tiktok": ",".join(sheet_data.get("hashtags_tiktok", [])),
                        "hashtags_youtube": ",".join(sheet_data.get("hashtags_youtube", [])),
                        "datetime": ""
                    })
                else:
                    # Fallback para archivos adicionales
                    metadata.append({
                        "filename": f.name,
                        "title": f"Video {idx+1}",
                        "description": "",
                        "hashtags": "",
                        "hashtags_tiktok": "",
                        "hashtags_youtube": "",
                        "datetime": ""
                    })
        except Exception as e:
            logger.error(f"Error cargando metadatos desde Google Sheets para {channel}: {e}")
            # Fallback a metadatos por defecto
            for idx, f in enumerate(sorted(files)):
                metadata.append({
                    "filename": f.name,
                    "title": f"Video {idx+1}",
                    "description": "",
                    "hashtags": "",
                    "hashtags_tiktok": "",
                    "hashtags_youtube": "",
                    "datetime": ""
                })
    else:
        # Para otros canales, usar metadatos por defecto
        for idx, f in enumerate(sorted(files)):
            metadata.append({
                "filename": f.name,
                "title": f"Video {idx+1}",
                "description": "",
                "hashtags": "",
                "hashtags_tiktok": "",
                "hashtags_youtube": "",
                "datetime": ""
            })

    return templates.TemplateResponse("edit_metadata.html", {"request": request, "channel": channel, "metadata": metadata})

@router.post("/panel/publish/{channel}/edit", response_class=HTMLResponse)
async def save_metadata_and_publish(request: Request, channel: str):
    """Recibe metadatos editados y lanza publicación masiva."""
    form = await request.form()
    reupload = request.query_params.get("reupload", "false").lower() == "true"
    files_str = form.get("files")
    if not isinstance(files_str, str):
        files_str = "[]"
    files = json.loads(files_str)
    outputs = []
    slots = {}
    for idx, filename in enumerate(files):
        outputs.append({"path": f"storage/salida/{channel}/{filename}", "index": idx+1})
        datetime_value = form.get(f"datetime_{idx}")
        if isinstance(datetime_value, str) and datetime_value and not datetime_value.endswith(("-05:00", "+00:00", "Z")):
            # Convertir formato datetime-local (2025-10-16T14:30) a formato completo
            datetime_value += ":00-05:00"
        slots[str(idx+1)] = datetime_value
    metadatos = []
    for idx in range(len(files)):
        # Procesar hashtags de TikTok
        hashtags_tiktok_value = form.get(f"hashtags_tiktok_{idx}")
        if isinstance(hashtags_tiktok_value, str):
            hashtags_tiktok_list = [h.strip() for h in hashtags_tiktok_value.split(",") if h.strip()]
        else:
            hashtags_tiktok_list = []

        # Procesar hashtags de YouTube
        hashtags_youtube_value = form.get(f"hashtags_youtube_{idx}")
        if isinstance(hashtags_youtube_value, str):
            hashtags_youtube_list = [h.strip() for h in hashtags_youtube_value.split(",") if h.strip()]
        else:
            hashtags_youtube_list = []

        # Combinar hashtags para compatibilidad con el sistema actual
        all_hashtags = hashtags_tiktok_list + hashtags_youtube_list

        metadatos.append({
            "title": str(form.get(f"title_{idx}") or ""),
            "description": str(form.get(f"description_{idx}") or ""),
            "hashtags": all_hashtags,
            "hashtags_tiktok": hashtags_tiktok_list,
            "hashtags_youtube": hashtags_youtube_list
        })

    # Actualizar metadatos en Google Sheets si el canal está soportado
    if channel in ["religion", "phrases", "beto"]:
        try:
            sheets_service = GoogleSheetsMetadataService(channel)
            success = sheets_service.update_metadata(metadatos)
            if success:
                logger.info(f"Metadatos actualizados exitosamente en Google Sheets para canal {channel}")
            else:
                logger.error(f"Error al actualizar metadatos en Google Sheets para canal {channel}")
        except Exception as e:
            logger.error(f"Error actualizando metadatos en Google Sheets para {channel}: {e}")

    # Aquí podrías guardar los metadatos en un archivo temporal si quieres persistencia
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes timeout
            logger.info(f"Calling publish endpoint with channel={channel}, reupload={reupload}")
            response = await client.post(f"{BASE_URL}/publish/youtube", json={
                "channel": channel,
                "outputs": outputs,
                "slots": slots,
                "use_sheets": False,
                "reupload": reupload,
                "metadata": metadatos
            })
            logger.info(f"Response status: {response.status_code}")
            response.raise_for_status()
            publish_data = response.json()
            logger.info(f"Publish data keys: {list(publish_data.keys()) if isinstance(publish_data, dict) else 'not dict'}")
            logger.info(f"Results count: {len(publish_data.get('results', [])) if isinstance(publish_data, dict) and 'results' in publish_data else 'no results key'}")
    except httpx.HTTPStatusError as e:
        error_text = e.response.text
        logger.error(f"HTTP error calling publish endpoint: {e.response.status_code} - {error_text}")

        # Check if it's an authentication error
        if "No valid credentials found" in error_text and "Please authenticate" in error_text:
            # Return a page with authentication instructions
            return templates.TemplateResponse("error.html", {
                "request": request,
                "error_title": "Autenticación Requerida",
                "error_message": f"El canal '{channel}' no tiene credenciales válidas de YouTube.",
                "error_details": "Necesitas autenticar este canal antes de poder publicar videos.",
                "action_url": f"/oauth2/authorize/youtube/{channel}",
                "action_text": "Autenticar Canal"
            })

        raise HTTPException(status_code=500, detail=f"Error en publicación: {error_text}")
    except Exception as e:
        logger.error(f"Error processing publish response: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error procesando respuesta: {str(e)}")

    # Verify we have the expected structure
    if not isinstance(publish_data, dict):
        logger.error(f"Response is not a dict: {type(publish_data)} - {publish_data}")
        raise HTTPException(status_code=500, detail="Respuesta inválida del endpoint de publicación")

    if "results" not in publish_data:
        logger.error(f"Response missing 'results' key: {publish_data}")
        raise HTTPException(status_code=500, detail="Respuesta inválida del endpoint de publicación")

    results = publish_data["results"]
    if not isinstance(results, list):
        logger.error(f"Results is not a list: {type(results)} - {results}")
        raise HTTPException(status_code=500, detail="Respuesta inválida del endpoint de publicación")

    return templates.TemplateResponse("publish.html", {"request": request, "channel": channel, "results": results})
