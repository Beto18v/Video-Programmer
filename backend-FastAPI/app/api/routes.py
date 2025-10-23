from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, field_validator
from loguru import logger
from sqlalchemy.orm import Session

# Global state storage for OAuth (in production, use Redis or similar)
states = {}

from app.db.session import get_db
from app.core.config import Settings
from app.services.youtube_service import YouTubeService
from app.services.report_service import ReportService
from app.models.plan import Plan
from app.models.video import Video


# Pydantic models for requests/responses

class PlanRequest(BaseModel):
    source_dir: str
    output_dir: str
    ordering: str = Field(default="name", description="name|date")
    group_size: int = Field(default=3, gt=0)
    output_pattern: str = Field(default="Semana{week:02d}_Dia{day:02d}.mp4")

    @field_validator("source_dir", "output_dir")
    @classmethod
    def validate_paths(cls, v):
        """Validate and sanitize directory paths."""
        if not v:
            raise ValueError("Path cannot be empty")
        # Prevent directory traversal
        if ".." in v or v.startswith("/"):
            raise ValueError("Invalid path: directory traversal not allowed")
        # Basic sanitization: remove dangerous characters
        import re
        if re.search(r'[<>:"|?*]', v):
            raise ValueError("Invalid characters in path")
        return v

    @field_validator("ordering")
    @classmethod
    def validate_ordering(cls, v):
        if v not in ["name", "date"]:
            raise ValueError("ordering must be 'name' or 'date'")
        return v

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

class UploadVideoRequest(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    category_id: str = "22"  # Default to People & Blogs
    privacy_status: str = "private"
    made_for_kids: bool = False
    scheduled_at: Optional[datetime] = None
    file_path: str  # Path to the video file on the server

class UploadVideoResponse(BaseModel):
    video_id: str
    url: str
    scheduled_at: Optional[datetime] = None

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
    # user_id = 1  # Placeholder
    
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
    
    config.updated_at = datetime.now(timezone.utc)
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

@router.post("/upload/video", response_model=UploadVideoResponse)
def upload_video_to_youtube(user_id: int, request: UploadVideoRequest, db: Session = Depends(get_db)):
    """Upload a video to YouTube with optional scheduling."""
    from app.services.plan_service import PlanService
    from app.models.user import User
    import json

    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user can upload
    plan_service = PlanService(db)
    if not plan_service.can_user_upload_video(user):
        raise HTTPException(
            status_code=403,
            detail="Upload limit exceeded for your current plan"
        )

    try:
        # Initialize YouTube service
        config = Settings()
        youtube_service = YouTubeService(config, user.id, db, user.active_channel_id)

        # Upload video
        result = youtube_service.upload_video(
            file_path=request.file_path,
            title=request.title,
            description=request.description or "",
            tags=request.tags,
            category_id=request.category_id,
            privacy_status=request.privacy_status,
            made_for_kids=request.made_for_kids,
            scheduled_at=request.scheduled_at
        )

        # Save to database
        video = Video(
            user_id=user.id,
            youtube_video_id=result["video_id"],
            title=request.title,
            description=request.description,
            tags=json.dumps(request.tags) if request.tags else None,
            category_id=request.category_id,
            privacy_status=request.privacy_status,
            made_for_kids=request.made_for_kids,
            scheduled_at=request.scheduled_at,
            youtube_url=result["url"],
            status="scheduled" if request.scheduled_at else "uploaded"
        )
        db.add(video)
        db.commit()
        db.refresh(video)

        # Increment user's video count
        plan_service.increment_user_video_count(user)

        return UploadVideoResponse(
            video_id=result["video_id"],
            url=result["url"],
            scheduled_at=request.scheduled_at
        )

    except Exception as e:
        logger.error(f"Error uploading video: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")
