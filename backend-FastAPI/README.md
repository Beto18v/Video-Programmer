# Video Programmer

A FastAPI application for video programming tasks with automatic Google OAuth2 authentication.

## Requirements

- Python 3.11+
- Poetry (for dependency management)

## Installation

1. Install Poetry (if not already installed):

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

## Configuration

The application uses hardcoded Google OAuth2 credentials for automatic authentication. No manual configuration is required for users.

## Running the Application

```bash
poetry run uvicorn app.main:app --reload
```

The application will be available at http://127.0.0.1:8000

## Authentication

This application uses automatic Google OAuth2 authentication:

1. **No Manual Setup Required**: Users don't need to configure OAuth credentials
2. **Automatic Flow**: Visit `/api/v1/login` to start the authentication process
3. **Token Storage**: OAuth tokens are automatically saved to the database
4. **User Management**: User information is stored and managed automatically

### OAuth Endpoints

- `GET /api/v1/login` - Redirects to OAuth authorization
- `GET /api/v1/oauth2/authorize/google` - Initiates Google OAuth flow
- `GET /api/v1/oauth2/callback/google` - Handles OAuth callback and token storage

## API Documentation

Once the application is running, visit http://127.0.0.1:8000/docs for interactive API documentation.

## Health Check

Visit http://127.0.0.1:8000/health to check the application status.

## Testing

The application includes comprehensive unit and integration tests:

```bash
poetry run pytest
```

All 31 tests should pass, covering OAuth endpoints, video services, and business logic.

## Project Structure

This project follows a professional FastAPI structure:

```
backend-FastAPI/
├── app/                          # Main application package
│   ├── main.py                   # FastAPI application instance and configuration
│   ├── api/                      # API layer
│   │   ├── v1/                   # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── router.py         # Main API router combining all endpoints
│   │   │   └── endpoints/        # Individual endpoint modules
│   │   │       ├── __init__.py
│   │   │       ├── videos.py     # Video processing endpoints (plan, group, publish)
│   │   │       ├── auth.py       # Authentication endpoints (OAuth)
│   │   │       └── reports.py    # Report endpoints
│   │   ├── panel_routes.py       # Web panel routes (optional UI)
│   │   └── salida_routes.py      # Output management routes (optional UI)
│   ├── core/                     # Core functionality
│   │   ├── __init__.py
│   │   └── config.py             # Application configuration
│   ├── models/                   # Data models and schemas
│   │   ├── __init__.py
│   │   ├── plan.py               # Video plan models
│   │   ├── user.py               # User and OAuth token models
│   │   └── oauth_token.py        # OAuth token storage models
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   ├── youtube_service.py    # YouTube API integration
│   │   ├── ffmpeg_service.py     # Video processing with FFmpeg
│   │   ├── metadata_service.py   # Metadata management
│   │   ├── scheduler_service.py  # Scheduling logic
│   │   ├── report_service.py     # Report generation
│   │   ├── oauth_service.py      # OAuth token management
│   │   └── grouping_service.py   # Video grouping logic
│   ├── utils/                    # Utility functions
│   │   ├── __init__.py
│   │   └── helpers.py            # Helper functions
│   ├── tests/                    # Unit tests
│   └── workers/                  # Background workers (if needed)
├── scripts/                      # Utility scripts
├── static/                       # Static files
├── storage/                      # File storage
│   ├── videos/                   # Input videos
│   └── salida/                   # Output videos
├── logs/                         # Application logs
├── tests/                        # Integration tests
├── requirements.txt              # Python dependencies
├── pyproject.toml                # Project configuration
└── README.md                     # This file
```

### Architecture Principles

- **Separation of Concerns**: API endpoints, business logic, and data models are separated
- **Versioned APIs**: API endpoints are versioned (v1) for future compatibility
- **Modular Services**: Each service handles a specific domain (YouTube, FFmpeg, OAuth, etc.)
- **Automatic Authentication**: Google OAuth2 integration with no manual configuration required
- **Configuration Management**: Centralized configuration in `core/config.py`
- **Error Handling**: Proper error handling and logging throughout
- **Testing**: Unit tests for services and integration tests for endpoints
