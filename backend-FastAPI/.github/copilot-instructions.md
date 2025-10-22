# Copilot Instructions for Video Programmer

## Overview

This project is a FastAPI-based backend for scheduling and uploading videos, primarily targeting YouTube integration. The codebase is organized for clarity, modularity, and future extensibility. All code, comments, and variable names must be in English. The frontend (React, not included here) will use English by default and support Spanish via i18n.

## Architecture & Key Components

- `app/api/`: FastAPI route definitions. Endpoints are grouped by feature (e.g., panel, salida, main routes).
- `app/services/`: Core business logic (e.g., YouTube upload, video grouping, metadata extraction, scheduling, reporting).
- `app/models/`: Pydantic models for data validation and serialization.
- `app/core/`: Configuration and shared utilities.
- `app/workers/`: Background processing (e.g., scheduled tasks).
- `app/tests/`: Unit tests for services and API endpoints.
- `scripts/`: Utility scripts for setup and integration (Google Sheets, service accounts, etc.).

## Developer Workflows

- **Run locally:**
  - `uvicorn app.main:app --reload` (default dev server)
- **Testing:**
  - `pytest` for unit tests (see `app/tests/` and `tests/`)
- **Type checking:**
  - `mypy .`
- **Virtual environment:**
  - Use Python 3.11+ and activate venv before installing dependencies.
- **Health check:**
  - Visit `/health` endpoint to verify service status.

## Patterns & Conventions

- All code and comments are in English. User-facing text defaults to English.
- API endpoints are grouped by domain in `app/api/`.
- Services encapsulate business logic and are imported by routes.
- Models use Pydantic for validation.
- Sensitive credentials (Google API, service accounts) are stored in `credentials.json` and `service-account.json` (never commit secrets).
- Logging is centralized in the `logs/` directory.
- Utility scripts in `scripts/` are for setup and integration, not core app logic.

## Integration Points

- **YouTube API:** OAuth2 authentication and video upload logic in `app/services/youtube_service.py`.
- **Google Sheets:** Setup and integration scripts in `scripts/`.
- **FFmpeg:** Used for video processing, binaries in `ffmpeg/bin/`.

## Project-Specific Notes

- The backend is designed to be extended for other platforms, but currently focuses on YouTube.
- All new features must follow the modular structure and English-only codebase rule.
- Internationalization is handled in the frontend; backend responses are in English.
- Payment integration and user plans are planned but not yet implemented.

## Example: Adding a New Service

- Create a new file in `app/services/` (e.g., `new_service.py`).
- Define business logic in service class/functions.
- Add corresponding API routes in `app/api/`.
- Use Pydantic models in `app/models/` for request/response validation.
- Write unit tests in `app/tests/`.

---

For questions or unclear conventions, review `INSTRUCTIONS.md` and `README.md` in the project root, or ask for clarification.
