from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from loguru import logger
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session

# Global state storage for OAuth (in production, use Redis or similar)
states = {}

from app.db.session import get_db
from app.services.metadata_service import MetadataServiceFactory
from app.core.config import Settings
from app.services.grouping_service import GroupingService
from app.services.scheduler_service import SchedulerService
from app.services.youtube_service import YouTubeService
from app.services.ffmpeg_service import FFmpegService
from app.services.report_service import ReportService
from app.models.plan import Plan, MediaGroup


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
    user_id: int
    outputs: List[OutputItem]
    slots: Dict[str, str]  # index -> iso datetime
    use_sheets: bool = True
    reupload: bool = Field(default=False, description="Allow reuploading videos that already have a YouTube ID")
    metadata: Optional[List[Dict[str, Any]]] = Field(default=None, description="Custom metadata to use instead of service metadata")

class PublishYouTubeResponse(BaseModel):
    results: List[Dict[str, Any]]

class ReportResponse(BaseModel):
    items: List[Dict[str, Any]]

class ChannelInfo(BaseModel):
    id: str
    title: str
    is_primary: bool
    is_active: bool

class ChannelsResponse(BaseModel):
    channels: list[ChannelInfo]
    active_channel_id: Optional[str] = None

class ProjectConfigRequest(BaseModel):
    channel_id: Optional[str] = None
    project_name: Optional[str] = None
    source_dir: Optional[str] = None
    output_dir: Optional[str] = None
    report_path: Optional[str] = None
    metadata_source_type: Optional[str] = None
    sheets_id: Optional[str] = None
    sheets_range: Optional[str] = None
    csv_path: Optional[str] = None
    json_path: Optional[str] = None
    ordering: Optional[str] = None
    group_size: Optional[int] = None
    output_pattern: Optional[str] = None
    timezone: Optional[str] = None
    start_date: Optional[str] = None
    times: Optional[str] = None
    yt_category_id: Optional[str] = None
    yt_privacy_status: Optional[str] = None
    yt_made_for_kids: Optional[bool] = None
    yt_tags_extra: Optional[str] = None
    tt_enabled: Optional[bool] = None
    tt_client_key: Optional[str] = None
    tt_client_secret: Optional[str] = None
    tt_publish_mode: Optional[str] = None

class ProjectConfigResponse(BaseModel):
    id: int
    user_id: int
    channel_id: Optional[str]
    project_name: Optional[str]
    source_dir: Optional[str]
    output_dir: Optional[str]
    report_path: Optional[str]
    metadata_source_type: str
    sheets_id: Optional[str]
    sheets_range: Optional[str]
    csv_path: Optional[str]
    json_path: Optional[str]
    ordering: str
    group_size: int
    output_pattern: str
    timezone: str
    start_date: str
    times: str
    yt_category_id: str
    yt_privacy_status: str
    yt_made_for_kids: bool
    yt_tags_extra: Optional[str]
    tt_enabled: bool
    tt_client_key: Optional[str]
    tt_client_secret: Optional[str]
    tt_publish_mode: str
    created_at: datetime
    updated_at: datetime


router = APIRouter()

# Dependency to check if user is admin
def require_admin(request, db: Session = Depends(get_db)):
    from app.services.oauth_service import OAuthService
    if not OAuthService.is_admin(db, request.user_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    return request.user_id

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
        from app.services.oauth_service import OAuthService
        from app.services.plan_service import PlanService
        from app.db.session import get_db
        from app.core.config import get_project_config, get_settings
        from app.models.user import User

        db = next(get_db())
        results = []

        # Get user and check plan limits
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        plan_service = PlanService(db)

        # Check if user can upload videos
        videos_to_upload = len([output for output in request.outputs
                               if not (report_service.get_entry_by_output_path(output.path) and
                                      report_service.get_entry_by_output_path(output.path).get("yt_video_id") and
                                      not request.reupload)])

        if videos_to_upload > 0:
            # Check if user has enough quota for new uploads
            current_count = user.uploaded_videos_count
            if user.plan and user.plan.max_videos > 0:
                remaining_quota = user.plan.max_videos - current_count
                if videos_to_upload > remaining_quota:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Plan limit exceeded. You can upload {remaining_quota} more videos. Current plan: {user.plan.display_name}"
                    )

        # Get active channel for user
        active_channel = OAuthService.get_active_channel_token(db, request.user_id)
        if not active_channel:
            raise HTTPException(status_code=400, detail="No active channel found for user")

        # Get project-specific configuration
        project_config = get_project_config(
            user_id=request.user_id,
            channel_id=active_channel.channel_id,
            db_session=db
        )

        # Create services with project-specific config
        youtube_service = YouTubeService(get_settings(), request.user_id, db, active_channel.channel_id)
        report_service = ReportService(project_config.report_path)

        # Get metadata for all outputs
        if request.metadata:
            # Use custom metadata from request
            metadata_list = request.metadata
        else:
            # Get metadata from service
            metadata_source = "sheets" if request.use_sheets else project_config.metadata_source_type
            metadata_service = MetadataServiceFactory.create_service(
                get_settings(),
                force_source=metadata_source,
                sheet_id=project_config.sheets_id,
                sheets_range=project_config.sheets_range
            )
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
                    category_id=project_config.yt_category_id,
                    privacy_status="private",  # Will be scheduled
                    made_for_kids=project_config.yt_made_for_kids
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
                    logs.append("❌ Video no encontrado en canal")
                   
                # Create video entry
                video_entry = {
                    "video_id": video_id,
                    "url": upload_result["url"],
                    "status": "success",
                    "scheduled_at": scheduled_at,
                    "verified": verified,
                    "logs": "\n".join(logs)
                }

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

                # Increment user's uploaded videos count
                plan_service.increment_user_video_count(user)

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

@router.get("/oauth2/authorize/google")
def authorize_google(add_channel: bool = False):
    """Initiate Google OAuth flow for user authentication or adding channel."""
    try:
        from app.services.oauth_service import OAuthService
        from app.db.session import get_db
        from google_auth_oauthlib.flow import Flow
        from pathlib import Path

        config = Settings()
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": config.yt_client_id,
                    "client_secret": config.yt_client_secret,
                    "redirect_uris": [config.yt_redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
            redirect_uri=config.yt_redirect_uri
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        # Store state in session or cache for validation
        # For simplicity, we'll use a simple in-memory dict (in production, use Redis or similar)
        states[state] = add_channel
        return RedirectResponse(authorization_url)
    except Exception as e:
        logger.error(f"Error initiating OAuth: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )

@router.get("/oauth2/callback/google")
def oauth2_callback_google(code: str, state: str | None = None):
    """Handle Google OAuth callback."""
    # Validate state
    if not state or state not in states:
        raise HTTPException(status_code=400, detail="Invalid state")

    is_add_channel = states[state]

    try:
        from app.services.oauth_service import OAuthService
        from app.db.session import get_db
        from google_auth_oauthlib.flow import Flow

        config = Settings()
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": config.yt_client_id,
                    "client_secret": config.yt_client_secret,
                    "redirect_uris": [config.yt_redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
            redirect_uri=config.yt_redirect_uri
        )

        flow.fetch_token(code=code)
        creds = flow.credentials

        # Get user info from Google
        user_info = OAuthService.get_google_user_info(creds.token)
        google_id = user_info['id']
        email = user_info['email']
        name = user_info['name']
        picture = user_info.get('picture')

        # Get channel info
        channel_info = OAuthService.get_youtube_channel_info(creds.token)
        channel_id = channel_info.get('id')
        channel_title = channel_info.get('title')

        # Save or update user and token in DB
        db = next(get_db())
        
        if is_add_channel:
            # For adding channel, use existing user (placeholder)
            # TODO: Get user_id from authentication/session
            user_id = 1  # Placeholder - should come from authenticated user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=400, detail="User not found")
        else:
            # For initial auth, create or update user
            user = OAuthService.get_user_by_google_id(db, google_id)
            if not user:
                user = OAuthService.create_user(db, google_id, email, name, picture)
            else:
                # Update user info if needed
                user.email = email
                user.name = name
                user.picture = picture
                db.commit()
            user_id = user.id

        # Save OAuth token
        OAuthService.save_oauth_token(db, user_id, creds, channel_id, channel_title, not is_add_channel)

        # If this is the first channel or primary, set as active
        if not is_add_channel or not user.active_channel_id:
            user.active_channel_id = channel_id
            db.commit()

        # Clean up state
        del states[state]

        logger.info(f"Google OAuth successful for user {user_id}, channel {channel_id}")
        return {"message": "OAuth successful", "user_id": user_id, "email": email, "channel_id": channel_id}
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )

@router.get("/login")
def login():
    """Redirect to Google OAuth authorization."""
    return RedirectResponse(url="/api/v1/oauth2/authorize/google")

@router.post("/channels/add")
def add_channel(db: Session = Depends(get_db)):
    """Initiate OAuth flow to add a new YouTube channel."""
    # For now, assume user is authenticated via some means
    # In production, you'd get user_id from JWT token
    # For this demo, we'll use a hardcoded user_id or get from session
    # TODO: Implement proper user authentication
    user_id = 1  # Placeholder
    
    # Start OAuth flow for adding channel
    return RedirectResponse(url=f"/api/v1/oauth2/authorize/google?add_channel=true")

@router.get("/channels", response_model=ChannelsResponse)
def get_channels(db: Session = Depends(get_db)):
    """Get all YouTube channels for the authenticated user."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    from app.services.oauth_service import OAuthService
    tokens = OAuthService.get_user_channels(db, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    
    channels = []
    for token in tokens:
        channels.append(ChannelInfo(
            id=token.channel_id or "",
            title=token.channel_title or "Unknown Channel",
            is_primary=token.is_primary == 1,
            is_active=(user.active_channel_id == token.channel_id) if user else False
        ))
    
    return ChannelsResponse(
        channels=channels,
        active_channel_id=user.active_channel_id if user else None
    )

@router.post("/channels/{channel_id}/select")
def select_channel(channel_id: str, db: Session = Depends(get_db)):
    """Select the active YouTube channel for operations."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    from app.services.oauth_service import OAuthService
    success = OAuthService.set_active_channel(db, user_id, channel_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Channel not found or not owned by user")
    
    return {"message": f"Channel {channel_id} selected as active"}

# Project Configuration Endpoints
from app.models.user import ProjectConfig as ProjectConfigModel

@router.get("/config", response_model=list[ProjectConfigResponse])
def get_project_configs(db: Session = Depends(get_db)):
    """Get all project configurations for the authenticated user."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    configs = db.query(ProjectConfigModel).filter(ProjectConfigModel.user_id == user_id).all()
    
    return [
        ProjectConfigResponse(
            id=config.id,
            user_id=config.user_id,
            channel_id=config.channel_id,
            project_name=config.project_name,
            source_dir=config.source_dir,
            output_dir=config.output_dir,
            report_path=config.report_path,
            metadata_source_type=config.metadata_source_type,
            sheets_id=config.sheets_id,
            sheets_range=config.sheets_range,
            csv_path=config.csv_path,
            json_path=config.json_path,
            ordering=config.ordering,
            group_size=config.group_size,
            output_pattern=config.output_pattern,
            timezone=config.timezone,
            start_date=config.start_date,
            times=config.times,
            yt_category_id=config.yt_category_id,
            yt_privacy_status=config.yt_privacy_status,
            yt_made_for_kids=config.yt_made_for_kids,
            yt_tags_extra=config.yt_tags_extra,
            tt_enabled=config.tt_enabled,
            tt_client_key=config.tt_client_key,
            tt_client_secret=config.tt_client_secret,
            tt_publish_mode=config.tt_publish_mode,
            created_at=config.created_at,
            updated_at=config.updated_at
        )
        for config in configs
    ]

@router.post("/config", response_model=ProjectConfigResponse)
def create_project_config(request: ProjectConfigRequest, db: Session = Depends(get_db)):
    """Create a new project configuration."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    from app.models.user import ProjectConfig as ProjectConfigModel
    
    # Check if config already exists for this user/channel
    existing = db.query(ProjectConfigModel).filter(
        ProjectConfigModel.user_id == user_id,
        ProjectConfigModel.channel_id == request.channel_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Configuration already exists for this channel")
    
    config = ProjectConfigModel(
        user_id=user_id,
        channel_id=request.channel_id,
        project_name=request.project_name,
        source_dir=request.source_dir,
        output_dir=request.output_dir,
        report_path=request.report_path,
        metadata_source_type=request.metadata_source_type or "sheets",
        sheets_id=request.sheets_id,
        sheets_range=request.sheets_range,
        csv_path=request.csv_path,
        json_path=request.json_path,
        ordering=request.ordering or "name",
        group_size=request.group_size or 3,
        output_pattern=request.output_pattern or "Semana{week:02d}_Dia{day:02d}.mp4",
        timezone=request.timezone or "America/Bogota",
        start_date=request.start_date or "2025-10-13",
        times=request.times or "10:00,14:00,18:00",
        yt_category_id=request.yt_category_id or "22",
        yt_privacy_status=request.yt_privacy_status or "private",
        yt_made_for_kids=request.yt_made_for_kids or False,
        yt_tags_extra=request.yt_tags_extra,
        tt_enabled=request.tt_enabled or False,
        tt_client_key=request.tt_client_key,
        tt_client_secret=request.tt_client_secret,
        tt_publish_mode=request.tt_publish_mode or "auto"
    )
    
    db.add(config)
    db.commit()
    db.refresh(config)
    
    return ProjectConfigResponse(
        id=config.id,
        user_id=config.user_id,
        channel_id=config.channel_id,
        project_name=config.project_name,
        source_dir=config.source_dir,
        output_dir=config.output_dir,
        report_path=config.report_path,
        metadata_source_type=config.metadata_source_type,
        sheets_id=config.sheets_id,
        sheets_range=config.sheets_range,
        csv_path=config.csv_path,
        json_path=config.json_path,
        ordering=config.ordering,
        group_size=config.group_size,
        output_pattern=config.output_pattern,
        timezone=config.timezone,
        start_date=config.start_date,
        times=config.times,
        yt_category_id=config.yt_category_id,
        yt_privacy_status=config.yt_privacy_status,
        yt_made_for_kids=config.yt_made_for_kids,
        yt_tags_extra=config.yt_tags_extra,
        tt_enabled=config.tt_enabled,
        tt_client_key=config.tt_client_key,
        tt_client_secret=config.tt_client_secret,
        tt_publish_mode=config.tt_publish_mode,
        created_at=config.created_at,
        updated_at=config.updated_at
    )

@router.put("/config/{config_id}", response_model=ProjectConfigResponse)
def update_project_config(config_id: int, request: ProjectConfigRequest, db: Session = Depends(get_db)):
    """Update an existing project configuration."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    from app.models.user import ProjectConfig as ProjectConfigModel
    
    config = db.query(ProjectConfigModel).filter(
        ProjectConfigModel.id == config_id,
        ProjectConfigModel.user_id == user_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Update only provided fields
    for field, value in request.model_dump(exclude_unset=True).items():
        if hasattr(config, field):
            setattr(config, field, value)
    
    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    
    return ProjectConfigResponse(
        id=config.id,
        user_id=config.user_id,
        channel_id=config.channel_id,
        project_name=config.project_name,
        source_dir=config.source_dir,
        output_dir=config.output_dir,
        report_path=config.report_path,
        metadata_source_type=config.metadata_source_type,
        sheets_id=config.sheets_id,
        sheets_range=config.sheets_range,
        csv_path=config.csv_path,
        json_path=config.json_path,
        ordering=config.ordering,
        group_size=config.group_size,
        output_pattern=config.output_pattern,
        timezone=config.timezone,
        start_date=config.start_date,
        times=config.times,
        yt_category_id=config.yt_category_id,
        yt_privacy_status=config.yt_privacy_status,
        yt_made_for_kids=config.yt_made_for_kids,
        yt_tags_extra=config.yt_tags_extra,
        tt_enabled=config.tt_enabled,
        tt_client_key=config.tt_client_key,
        tt_client_secret=config.tt_client_secret,
        tt_publish_mode=config.tt_publish_mode,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.delete("/config/{config_id}")
def delete_project_config(config_id: int, db: Session = Depends(get_db)):
    """Delete a project configuration."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    config = db.query(ProjectConfigModel).filter(
        ProjectConfigModel.id == config_id,
        ProjectConfigModel.user_id == user_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    db.delete(config)
    db.commit()
    
    return {"message": "Configuration deleted successfully"}

@router.get("/user/role")
def get_user_role(request, db: Session = Depends(get_db)):
    """Get the role of the current user."""
    from app.services.oauth_service import OAuthService
    role = OAuthService.get_user_role(db, request.user_id)
    return {"role": role}

# Plan management endpoints
@router.get("/plans")
def get_available_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans."""
    from app.services.plan_service import PlanService
    plan_service = PlanService(db)
    plans = plan_service.get_all_plans()
    return [
        {
            "id": plan.id,
            "name": plan.name,
            "display_name": plan.display_name,
            "description": plan.description,
            "max_videos": plan.max_videos,
            "price": plan.price
        }
        for plan in plans
    ]

@router.get("/user/plan")
def get_user_plan(request, db: Session = Depends(get_db)):
    """Get the current user's plan information."""
    from app.services.plan_service import PlanService
    from app.models.user import User

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan_service = PlanService(db)
    return plan_service.get_user_plan_info(user)

@router.put("/user/plan")
def update_user_plan(plan_id: int, request, db: Session = Depends(get_db)):
    """Update the current user's subscription plan."""
    from app.services.plan_service import PlanService
    from app.models.user import User

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan_service = PlanService(db)
    updated_user = plan_service.update_user_plan(user, plan_id)
    return {"message": "Plan updated successfully", "plan": plan_service.get_user_plan_info(updated_user)}

@router.get("/user/can-upload")
def can_user_upload_video(request, db: Session = Depends(get_db)):
    """Check if the current user can upload more videos."""
    from app.services.plan_service import PlanService
    from app.models.user import User

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan_service = PlanService(db)
    return {"can_upload": plan_service.can_user_upload_video(user)}
