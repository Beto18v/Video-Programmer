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

```
app/
  api/          # API endpoints
  core/         # Core functionality
  services/     # Business logic services
  models/       # Data models
  workers/      # Background workers
  tests/        # Unit tests
scripts/        # Utility scripts
logs/           # Application logs
```
