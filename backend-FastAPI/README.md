# Video Programmer Backend

## Estado del Proyecto (Octubre 2025)
El backend está desarrollado con **FastAPI** y actualmente cuenta con los siguientes módulos y funcionalidades principales:

- **Autenticación OAuth**: Integración con Google para login seguro.
- **Gestión de usuarios y roles**: Modelos y servicios para usuarios, roles y permisos.
- **Procesamiento de videos**: Integración con FFmpeg para manipulación y procesamiento de archivos multimedia.
- **Servicios de agrupamiento y metadatos**: Lógica para organizar videos y extraer información relevante.
- **Programación de tareas**: Scheduler para tareas automáticas y workers para procesamiento en segundo plano.
- **Integración con Google Sheets**: Scripts y endpoints para sincronizar datos con hojas de cálculo.

## Instalación
1. Clona el repositorio.
2. Instala las dependencias con `pip install -r requirements.txt`.
3. Configura las variables de entorno en `.env` (ver ejemplo en `.env.example`).
## Estructura del proyecto

```
backend-FastAPI/
│   pyproject.toml
│   requirements.txt
│   run_server.py
│   start_project.ps1
│   .env
│   README_OAUTH.md
│   README.md
│
├── app/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── workers/
│
├── ffmpeg/
├── logs/
├── output/
├── scripts/
├── static/
├── storage/
├── tests/
└── videos/
```

## Avances recientes

- Estructura modular y escalable.
- Endpoints REST para usuarios, videos y procesamiento.
- Scripts para inicialización y migración de datos.
- Pruebas unitarias en `tests/` para servicios principales.
- Documentación de endpoints en los archivos de rutas.

## Endpoints principales

Consultar en `app/api/routes.py` y `app/api/salida_routes.py` para ver los endpoints disponibles y su documentación.

## Notas

- Para más información sobre la integración OAuth, ver `README_OAUTH.md`.
- La carpeta `ffmpeg/` incluye binarios y documentación para procesamiento multimedia.

---
Actualizado: Octubre 2025
# Video Programmer

A FastAPI application for automated video programming with multi-channel YouTube publishing, dynamic project configurations, and comprehensive metadata management.

## Features

- 🔐 **Automatic Google OAuth2 Authentication** - No manual setup required
- 📺 **Multi-Channel YouTube Support** - Manage multiple YouTube channels per user
- ⚙️ **Dynamic Project Configurations** - Per-user, per-channel customizable settings
- 🎬 **Automated Video Processing** - FFmpeg integration for video editing and grouping
- 📊 **Metadata Management** - Support for Google Sheets, CSV, and JSON metadata sources
- 📅 **Intelligent Scheduling** - Automated publishing based on timezone and availability
- 📈 **Comprehensive Reporting** - Detailed reports on video processing and publishing
- 🎯 **TikTok Integration Ready** - Extensible architecture for additional platforms

## Requirements

- Python 3.11+
- Poetry (for dependency management)
- SQLite (default) or PostgreSQL/MySQL (production)
- FFmpeg (for video processing)

## Installation

1. **Install Poetry** (if not already installed):

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. **Install dependencies**:

   ```bash
   poetry install
   ```

3. **Install FFmpeg** (required for video processing):
   - Download from: https://ffmpeg.org/download.html
   - Add to system PATH

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration (choose one)
# SQLite (default - no additional setup)
DATABASE_URL=sqlite:///./video_programmer.db

# PostgreSQL (recommended for production)
DATABASE_URL=postgresql://postgres@localhost:5432/video_programmer
POSTGRES_PASSWORD=your_secure_password_here

# MySQL (alternative production option)
# DATABASE_URL=mysql://user:password@localhost/dbname

# Google OAuth2 (Pre-configured)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key

# Application Settings
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Encryption (for secure token storage)
ENCRYPTION_KEY=your-32-byte-base64-encryption-key-here

# Optional: TikTok Integration
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
```

### Database Setup

The application supports multiple database backends with automatic table creation:

#### SQLite (Default - Development)

- **No additional setup required**
- **Best for**: Development, testing, single-user scenarios
- **Limitations**: No concurrent access, file-based storage

#### PostgreSQL (Recommended for Production)

- **Installation**: Download from https://www.postgresql.org/download/windows/
- **Configuration**:
  1. Install PostgreSQL with default settings
  2. Set `POSTGRES_PASSWORD` in your `.env` file
  3. The application will automatically create the database and tables
- **Features**: Concurrent access, advanced security, production-ready
- **Connection**: `postgresql://postgres:{password}@localhost:5432/video_programmer`

#### MySQL (Alternative Production)

- **Installation**: Download from https://dev.mysql.com/downloads/mysql/
- **Configuration**: Set `DATABASE_URL=mysql://user:password@localhost/dbname`
- **Note**: Requires additional MySQL driver installation

### Security Features

- **Encrypted Token Storage**: OAuth tokens are encrypted using Fernet symmetric encryption
- **Environment-Based Configuration**: All sensitive data loaded from environment variables
- **Automatic Database Setup**: Tables created securely on first run

## Running the Application

```bash
# Development mode
poetry run uvicorn app.main:app --reload

# Production mode
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The application will be available at:

- **API**: http://127.0.0.1:8000
- **Documentation**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health

## Authentication & Multi-Channel Support

### User Authentication

1. **Automatic OAuth Flow**: Visit `/api/v1/login` to authenticate with Google
2. **Token Management**: OAuth tokens are securely stored in the database
3. **User Profiles**: User information is automatically managed

### Multi-Channel YouTube Management

Each user can connect multiple YouTube channels:

#### Add a YouTube Channel

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/channels/add"
```

#### List User's Channels

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/channels" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Select Active Channel

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/channels/UC123456789/select"
```

## Project Configurations

### Overview

The application supports **dynamic project configurations** where each user can have different settings per YouTube channel. This replaces hardcoded configurations with database-backed, customizable settings.

### Configuration Fields

Each project configuration includes:

- **Project Info**: Name, directories (source, output, reports)
- **Metadata Sources**: Google Sheets, CSV, or JSON files
- **Processing Settings**: Ordering, grouping, output patterns
- **Scheduling**: Timezone, start date, publishing times
- **YouTube Settings**: Category, privacy, tags, made-for-kids flag
- **TikTok Settings**: Client credentials, publish mode

### Managing Configurations

#### Get All Configurations

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/config"
```

#### Create New Configuration

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/config" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "UC123456789",
    "project_name": "My YouTube Channel",
    "source_dir": "D:\\Videos",
    "output_dir": "D:\\Output",
    "metadata_source_type": "sheets",
    "sheets_id": "1ABC...XYZ",
    "timezone": "America/Bogota"
  }'
```

#### Update Configuration

```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/config/1" \
  -H "Content-Type: application/json" \
  -d '{"group_size": 5, "yt_privacy_status": "public"}'
```

#### Delete Configuration

```bash
curl -X DELETE "http://127.0.0.1:8000/api/v1/config/1"
```

## API Endpoints

### Authentication

- `GET /api/v1/login` - Start OAuth flow
- `GET /api/v1/oauth2/callback/google` - OAuth callback

### Channel Management

- `GET /api/v1/channels` - List user's channels
- `GET /api/v1/channels/add` - Add new YouTube channel
- `POST /api/v1/channels/{channel_id}/select` - Select active channel

### Project Configurations

- `GET /api/v1/config` - Get all configurations
- `POST /api/v1/config` - Create configuration
- `PUT /api/v1/config/{id}` - Update configuration
- `DELETE /api/v1/config/{id}` - Delete configuration

### Video Processing

- `POST /api/v1/plan` - Create video processing plan
- `POST /api/v1/group` - Group videos for processing
- `POST /api/v1/publish` - Publish videos to YouTube

### Reports

- `GET /api/v1/reports/{report_id}` - Get processing report

## Database Architecture

### Tables Overview

```
users (User authentication)
├── id (Primary Key)
├── google_id (Unique)
├── email
├── name
├── picture
└── active_channel_id

oauth_tokens (OAuth tokens per channel)
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── provider ("google")
├── access_token (Encrypted)
├── refresh_token (Encrypted)
├── channel_id (YouTube Channel ID)
├── channel_title
├── is_primary (0/1)
└── expires_at

project_configs (Per-user, per-channel configurations)
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── channel_id (Optional, for channel-specific configs)
├── project_name
├── source_dir, output_dir, report_path
├── metadata_source_type ("sheets"/"csv"/"json")
├── sheets_id, sheets_range, csv_path, json_path
├── ordering, group_size, output_pattern
├── timezone, start_date, times
├── yt_category_id, yt_privacy_status, yt_made_for_kids, yt_tags_extra
└── tt_enabled, tt_client_key, tt_client_secret, tt_publish_mode
```

### Database Security

- **Connection Encryption**: Use SSL/TLS for production databases
- **Token Encryption**: OAuth tokens are stored encrypted
- **Access Control**: Row-level security via user_id foreign keys
- **Prepared Statements**: SQLAlchemy prevents SQL injection
- **Connection Pooling**: Efficient connection management

## Testing

Run the comprehensive test suite:

```bash
poetry run pytest
```

Tests cover:

- ✅ OAuth authentication flows
- ✅ Multi-channel management
- ✅ Project configuration CRUD
- ✅ Video processing services
- ✅ API endpoint validation
- ✅ Database operations

## Project Structure

```
backend-FastAPI/
├── app/
│   ├── main.py                   # FastAPI app instance
│   ├── api/
│   │   ├── routes.py             # Main API routes with auth & config endpoints
│   │   └── v1/
│   │       ├── router.py         # Versioned API router
│   │       └── endpoints/        # Video processing endpoints
│   ├── core/
│   │   └── config.py             # Dynamic configuration system
│   ├── models/
│   │   ├── user.py               # User, OAuth, ProjectConfig models
│   │   └── plan.py               # Video processing models
│   └── services/                 # Business logic services
├── scripts/                      # Database migration scripts
├── storage/                      # File storage (videos, output)
├── logs/                         # Application logs
└── tests/                        # Test suites
```

## Architecture Principles

- **🔄 Multi-Channel Support**: Each user can manage multiple YouTube channels
- **⚙️ Dynamic Configuration**: Database-backed project settings with fallback defaults
- **🔐 Secure Authentication**: Encrypted token storage with automatic refresh
- **📊 Metadata Flexibility**: Support for multiple metadata sources
- **🎬 Video Processing**: Automated FFmpeg integration with intelligent grouping
- **📅 Smart Scheduling**: Timezone-aware publishing with conflict resolution
- **🧪 Comprehensive Testing**: Unit and integration tests for reliability
- **📖 API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Production Deployment

For production deployment:

1. **Database**: Use PostgreSQL or MySQL instead of SQLite
2. **SSL/TLS**: Enable HTTPS with proper certificates
3. **Environment Variables**: Use secure secret management
4. **Monitoring**: Add logging and monitoring solutions
5. **Backup**: Implement regular database backups
6. **Scaling**: Consider containerization with Docker/Kubernetes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

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
