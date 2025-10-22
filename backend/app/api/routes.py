from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from loguru import logger
from google_auth_oauthlib.flow import Flow

from app.core.config import Settings
from app.services.metadata_service import MetadataServiceFactory
from app.services.grouping_service import GroupingService
from app.services.scheduler_service import SchedulerService
from app.services.youtube_service import YouTubeService
from app.services.tiktok_service import TikTokService
from app.services.ffmpeg_service import FFmpegService
from app.services.report_service import ReportService
from app.models.group_plan import Plan, MediaGroup


# Pydantic models for requests/responses

class PlanRequest(BaseModel):
    source_dir: str
    output_dir: str
    ordering: str = Field(default="name", description="name|date")
    group_size: int = Field(default=3, gt=0)
    output_pattern: str = Field(default="Semana{week:02d}_Dia{day:02d}.mp4")

class PlanResponse(BaseModel):
    plan: Plan
    slots: Dict[str, str]  # index -> iso datetime
    metadata_preview: List[Dict[str, Any]]  # Preview of first 5 metadata rows

class GroupRequest(BaseModel):
    plan: Plan
    force: bool = Field(default=False, description="Force overwrite existing output files")

class GroupItem(BaseModel):
    index: int
    mode: str  # copy|reencode
    ok: bool
    output: str
    error: Optional[str] = None

class GroupResponse(BaseModel):
    items: List[GroupItem]

class OutputItem(BaseModel):
    path: str
    index: int

class PublishYouTubeRequest(BaseModel):
    channel: str
    outputs: List[OutputItem]
    slots: Dict[str, str]  # index -> iso datetime
    use_sheets: bool = True
    reupload: bool = Field(default=False, description="Allow reuploading videos that already have a YouTube ID")
    metadata: Optional[List[Dict[str, Any]]] = Field(default=None, description="Custom metadata to use instead of service metadata")

class PublishYouTubeResponse(BaseModel):
    results: List[Dict[str, Any]]

class PublishTikTokRequest(BaseModel):
    outputs: List[OutputItem]
    slots: Dict[str, str]
    use_sheets: bool = True

class PublishTikTokResponse(BaseModel):
    results: List[Dict[str, Any]]

class ReportResponse(BaseModel):
    items: List[Dict[str, Any]]


router = APIRouter()

# Global config instance - removed to avoid issues

@router.get("/health")
def health() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}

@router.post("/plan", response_model=PlanResponse)
def create_plan(request: PlanRequest) -> PlanResponse:
    """Create a grouping plan and calculate publication slots."""
    try:
        logger.info(f"Received plan request: source_dir={request.source_dir}, output_dir={request.output_dir}")
        # Get configuration
        config = Settings()

        # Create plan
        grouping_service = GroupingService()
        plan = grouping_service.build_plan(
            source_dir=Path(request.source_dir),
            output_dir=Path(request.output_dir),
            ordering=request.ordering,
            group_size=request.group_size,
            output_pattern=request.output_pattern
        )

        # Calculate slots
        # Convert config values to correct types
        start_date_obj = date.fromisoformat(config.start_date)
        times_list = config.times if isinstance(config.times, list) else config.times.split(',')
        
        slots = SchedulerService.slots_for_plan(
            plan=plan,
            start_date=start_date_obj,
            times=times_list,
            timezone=config.timezone
        )

        # Convert slots to dict with string indices
        slots_dict = {str(group_index): slot.isoformat() for group_index, slot in slots.items()}

        # Get metadata preview (first 5 rows)
        metadata_service = MetadataServiceFactory.create_service(config)
        metadata_preview = metadata_service.get_metadata_for_outputs(5)

        return PlanResponse(plan=plan, slots=slots_dict, metadata_preview=metadata_preview)

    except Exception as e:
        logger.error(f"Error creating plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create plan: {str(e)}"
        )

@router.post("/group", response_model=GroupResponse)
def group_videos(request: GroupRequest) -> GroupResponse:
    """Concatenate video groups using FFmpeg safe concat."""
    try:
        config = Settings()
        report_service = ReportService(config.report_path)
        items = []
        ffmpeg_service = FFmpegService()

        for i, group in enumerate(request.plan.groups):
            try:
                output_path = Path(group.output)
                
                # Check if output file exists and force is not set
                if output_path.exists() and not request.force:
                    items.append(GroupItem(
                        index=i+1,
                        mode="skipped",
                        ok=False,
                        output=group.output,
                        error="Output file already exists. Use force=true to overwrite."
                    ))
                    continue

                # Use safe_concat to concatenate videos
                result = ffmpeg_service.safe_concat(
                    input_files=[Path(f) for f in group.inputs],
                    output_file=output_path
                )

                ok = bool(result.get("ok", False))
                error = str(result.get("error")) if result.get("error") else None

                items.append(GroupItem(
                    index=i+1,
                    mode=str(result.get("mode", "unknown")),
                    ok=ok,
                    output=group.output,
                    error=error
                ))

                # Report entry
                report_entry = {
                    "output_path": group.output,
                    "created_at": datetime.now().isoformat()
                }
                if error:
                    report_entry["error"] = error
                report_service.append_entry(report_entry)

            except Exception as e:
                logger.error(f"Error concatenating group {i+1}: {e}")
                error_str = str(e)
                items.append(GroupItem(
                    index=i+1,
                    mode="unknown",
                    ok=False,
                    output="",
                    error=error_str
                ))

                # Report entry for error
                report_service.append_entry({
                    "output_path": group.output,
                    "created_at": datetime.now().isoformat(),
                    "errors": [error_str]
                })

        return GroupResponse(items=items)

    except Exception as e:
        logger.error(f"Error in group operation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to group videos: {str(e)}"
        )

@router.post("/publish/youtube", response_model=PublishYouTubeResponse)
def publish_youtube(request: PublishYouTubeRequest) -> PublishYouTubeResponse:
    """Publish videos to YouTube with metadata and scheduling."""
    try:
        config = Settings()
        results = []
        youtube_service = YouTubeService(config, request.channel)
        report_service = ReportService(config.report_path)

        # Get metadata for all outputs
        if request.metadata:
            # Use custom metadata from request
            metadata_list = request.metadata
        else:
            # Get metadata from service
            metadata_source = "sheets" if request.use_sheets else config.metadata_source_type
            metadata_service = MetadataServiceFactory.create_service(config, force_source=metadata_source)
            num_outputs = len(request.outputs)
            metadata_list = metadata_service.get_metadata_for_outputs(num_outputs)

        for output in request.outputs:
            logs = []
            try:
                logs.append(f"Procesando video {output.index}: {output.path}")

                # Check if video already has a YouTube ID and reupload is not enabled
                existing_entry = report_service.get_entry_by_output_path(output.path)
                if existing_entry and existing_entry.get("yt_video_id") and not request.reupload:
                    # Get metadata for this output to show current title
                    meta_index = output.index - 1
                    if meta_index < len(metadata_list):
                        current_metadata = metadata_list[meta_index]
                        current_title = current_metadata.get("title", f"Video {output.index}")
                    else:
                        current_title = f"Video {output.index}"

                    logs.append("Video ya existe en reporte, omitiendo subida")
                    results.append({
                        "index": output.index,
                        "title": current_title,
                        "video_id": existing_entry["yt_video_id"],
                        "url": existing_entry.get("yt_url"),
                        "status": "skipped",
                        "reason": "Video already uploaded. Use reupload=true to upload again.",
                        "logs": "\n".join(logs)
                    })

                    # Update report with current title
                    report_service.append_entry({
                        "output_path": output.path,
                        "title": current_title,
                        "yt_video_id": existing_entry["yt_video_id"],
                        "yt_url": existing_entry.get("yt_url"),
                        "status": "skipped"
                    })
                    continue

                # Get metadata for this output
                meta_index = output.index - 1
                if meta_index < len(metadata_list):
                    metadata = metadata_list[meta_index]
                    logs.append(f"Metadatos obtenidos: {metadata.get('title', 'Sin título')}")
                else:
                    metadata = {"title": f"Video {output.index}", "description": "", "hashtags": [], "thumbnail": None}
                    logs.append("Usando metadatos por defecto")

                # Upload video
                logs.append("Iniciando subida a YouTube...")
                upload_result = youtube_service.upload_video(
                    file_path=output.path,
                    title=metadata["title"],
                    description=metadata["description"],
                    tags=metadata["hashtags"],
                    category_id=config.yt_category_id,
                    privacy_status="private",  # Will be scheduled
                    made_for_kids=config.yt_made_for_kids
                )

                video_id = upload_result["video_id"]
                logs.append(f"Video subido exitosamente con ID: {video_id}")

                # Set thumbnail if available
                if metadata.get("thumbnail"):
                    try:
                        logs.append("Configurando thumbnail...")
                        youtube_service.set_thumbnail(video_id, metadata["thumbnail"])
                        logs.append("Thumbnail configurado")
                    except Exception as e:
                        logs.append(f"Error configurando thumbnail: {e}")

                # Schedule publication
                scheduled_at = None
                yt_publish_at = None
                if str(output.index) in request.slots:
                    slot_str = request.slots[str(output.index)]
                    try:
                        logs.append(f"Programando publicación para: {slot_str}")
                        # Parse ISO datetime
                        publish_at = datetime.fromisoformat(slot_str.replace('Z', '+00:00'))
                        youtube_service.schedule_publish(video_id, publish_at)
                        scheduled_at = slot_str
                        yt_publish_at = publish_at.isoformat()
                        logs.append("Publicación programada exitosamente")
                    except Exception as e:
                        logs.append(f"Error programando publicación: {e}")

                # Verify video exists
                logs.append("Verificando que el video existe en YouTube...")
                verified = youtube_service.verify_video_exists(video_id)
                if verified:
                    logs.append("✅ Video verificado en canal")
                else:
                    logs.append("⚠️ Video no pudo ser verificado")

                results.append({
                    "index": output.index,
                    "title": metadata["title"],
                    "video_id": video_id,
                    "url": upload_result["url"],
                    "status": "success",
                    "scheduled_at": scheduled_at,
                    "verified": verified,
                    "logs": "\n".join(logs)
                })

                # Update report
                report_service.append_entry({
                    "output_path": output.path,
                    "title": metadata["title"],
                    "yt_video_id": video_id,
                    "yt_url": upload_result["url"],
                    "yt_publish_at": yt_publish_at,
                    "scheduled_at": scheduled_at,
                    "verified": verified
                })

            except Exception as e:
                error_str = str(e)
                logs.append(f"ERROR: {error_str}")
                logger.error(f"Failed to publish output {output.index}: {e}")
                results.append({
                    "index": output.index,
                    "title": f"Video {output.index}",
                    "video_id": None,
                    "url": None,
                    "status": "error",
                    "error": error_str,
                    "logs": "\n".join(logs)
                })

                # Update report with error
                report_service.append_entry({
                    "output_path": output.path,
                    "errors": [error_str]
                })

        return PublishYouTubeResponse(results=results)

    except Exception as e:
        logger.error(f"Error in YouTube publish: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish to YouTube: {str(e)}"
        )

@router.post("/publish/tiktok", response_model=PublishTikTokResponse)
def publish_tiktok(request: PublishTikTokRequest) -> PublishTikTokResponse:
    """Publish videos to TikTok (optional)."""
    try:
        config = Settings()
        results = []
        tiktok_service = TikTokService(config)
        report_service = ReportService(config.report_path)

        # Get metadata service
        metadata_source = "sheets" if request.use_sheets else config.metadata_source_type
        metadata_service = MetadataServiceFactory.create_service(config, force_source=metadata_source)

        # Get metadata for all outputs
        num_outputs = len(request.outputs)
        metadata_list = metadata_service.get_metadata_for_outputs(num_outputs)

        for output in request.outputs:
            try:
                # Get metadata for this output
                meta_index = output.index - 1
                if meta_index < len(metadata_list):
                    metadata = metadata_list[meta_index]
                else:
                    metadata = {"title": f"Video {output.index}", "description": "", "hashtags": []}

                # Upload video
                upload_result = tiktok_service.upload_video(
                    file_path=output.path,
                    title=metadata["title"],
                    description=metadata["description"],
                    hashtags=metadata["hashtags"],
                    mode="auto"
                )

                results.append({
                    "index": output.index,
                    "status": upload_result["status"],
                    "video_id": upload_result["video_id"]
                })

                # Update report
                report_service.append_entry({
                    "output_path": output.path,
                    "tiktok_status": upload_result["status"],
                    "tiktok_video_id": upload_result["video_id"]
                })

            except Exception as e:
                logger.error(f"Failed to publish TikTok output {output.index}: {e}")
                error_str = str(e)
                results.append({
                    "index": output.index,
                    "status": "error",
                    "video_id": None,
                    "error": error_str
                })

                # Update report with error
                report_service.append_entry({
                    "output_path": output.path,
                    "tiktok_status": "error",
                    "errors": [error_str]
                })

        return PublishTikTokResponse(results=results)

    except Exception as e:
        logger.error(f"Error in TikTok publish: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish to TikTok: {str(e)}"
        )

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

@router.get("/oauth2/authorize/youtube/{channel}")
def authorize_youtube(channel: str):
    """Initiate YouTube OAuth flow for a specific channel."""
    try:
        config = Settings()
        flow = Flow.from_client_secrets_file(
            str(Path("credentials.json")),
            scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
            redirect_uri=config.yt_redirect_uri
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        # Store channel in state for callback
        state_with_channel = f"{channel}:{state}"
        authorization_url = authorization_url.replace(f"state={state}", f"state={state_with_channel}")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logger.error(f"Error initiating OAuth: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )

@router.get("/oauth2/callback/youtube")
def oauth2_callback_youtube(code: str, state: str | None = None):
    """Handle YouTube OAuth callback."""
    try:
        # Extract channel from state (format: "channel:original_state")
        if not state or ":" not in state:
            raise HTTPException(status_code=400, detail="Invalid state parameter")

        channel, original_state = state.split(":", 1)

        config = Settings()
        flow = Flow.from_client_secrets_file(
            str(Path("credentials.json")),
            scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
            redirect_uri=config.yt_redirect_uri
        )

        # Set the state back to the original state for flow.fetch_token
        flow._state = original_state

        flow.fetch_token(code=code)
        creds = flow.credentials

        # Ensure token directory exists
        token_dir = Path(f".tokens/{channel}")
        token_dir.mkdir(parents=True, exist_ok=True)
        with open(token_dir / "token.json", 'w') as token:
            token.write(creds.to_json())

        logger.info(f"YouTube OAuth successful for channel {channel}")
        return {"message": f"OAuth successful for channel {channel}", "token_saved": True, "channel": channel}
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )