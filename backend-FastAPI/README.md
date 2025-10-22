# Video Programmer

A FastAPI application for video programming tasks.

## Requirements

- Python 3.11+
- pip

## Installation

1. Create a virtual environment:

   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On macOS/Linux
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Application

```
uvicorn app.main:app --reload
```

The application will be available at http://127.0.0.1:8000

## Health Check

Visit http://127.0.0.1:8000/health to check the application status.

## Development

- Run tests: `pytest`
- Type checking: `mypy .`

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
│   │   └── plan.py               # Video plan models
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   ├── youtube_service.py    # YouTube API integration
│   │   ├── ffmpeg_service.py     # Video processing with FFmpeg
│   │   ├── metadata_service.py   # Metadata management
│   │   ├── scheduler_service.py  # Scheduling logic
│   │   └── report_service.py     # Report generation
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
- **Modular Services**: Each service handles a specific domain (YouTube, FFmpeg, etc.)
- **Configuration Management**: Centralized configuration in `core/config.py`
- **Error Handling**: Proper error handling and logging throughout
- **Testing**: Unit tests for services and integration tests for endpoints
