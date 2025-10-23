# 📹 Video Programmer API - Documentación Completa

## 🌟 Descripción General

Video Programmer API es una plataforma robusta desarrollada en FastAPI que automatiza la programación, procesamiento y publicación de videos en YouTube. La plataforma incluye características avanzadas de seguridad, autenticación por roles, gestión de suscripciones y procesamiento de contenido multimedia.

### 🎯 Características Principales

- **🔒 Seguridad Avanzada**: Autenticación JWT, autorización por roles, rate limiting
- **📺 Gestión de Videos**: Procesamiento automático con FFmpeg, metadatos dinámicos
- **🌐 Integración YouTube**: Subida automática, programación de publicaciones
- **💳 Sistema de Pagos**: Integración con MercadoPago y Stripe
- **📊 Monitoreo**: Logging estructurado, métricas de rendimiento
- **🔄 Programación Automática**: Scheduler para contenido recurrente

---

## 📋 Tabla de Contenidos

1. [Instalación y Configuración](#instalación-y-configuración)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Autenticación y Autorización](#autenticación-y-autorización)
4. [API Endpoints](#api-endpoints)
5. [Flujo de Usuario](#flujo-de-usuario)
6. [Despliegue](#despliegue)
7. [Seguridad](#seguridad)
8. [Monitoreo y Logs](#monitoreo-y-logs)
9. [Troubleshooting](#troubleshooting)
10. [Manual de Usuario](#manual-de-usuario)

---

## 🚀 Instalación y Configuración

### Requisitos del Sistema

- **Python**: 3.11 o superior
- **Base de datos**: PostgreSQL 13+ (SQLite para desarrollo)
- **FFmpeg**: Para procesamiento de video
- **Redis**: (Opcional) Para rate limiting distribuido

### Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/Beto18v/Video-Programmer.git
cd Video-Programmer/backend-FastAPI

# 2. Instalar dependencias automáticamente
python scripts/install_security_features.py

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Inicializar base de datos
python scripts/initialize_roles.py
python scripts/initialize_plans.py

# 5. Ejecutar la aplicación
python -m app.main_secure
```

### Instalación Manual

```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Instalar dependencias de seguridad adicionales
pip install redis bleach python-magic cryptography slowapi prometheus-client email-validator

# 4. Configurar FFmpeg
# Windows: Descargar de https://ffmpeg.org/download.html
# Linux: sudo apt install ffmpeg
# Mac: brew install ffmpeg
```

### Configuración de Variables de Entorno

```env
# .env - Configuración Principal

# Entorno
ENVIRONMENT=development  # development, staging, production

# Seguridad
SECRET_KEY=tu-clave-super-secreta-minimo-32-caracteres-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/video_programmer
POSTGRES_PASSWORD=contraseña_segura

# YouTube API
YT_CLIENT_ID=tu-google-client-id
YT_CLIENT_SECRET=tu-google-client-secret
YT_REDIRECT_URI=http://localhost:8000/api/v1/oauth2/callback/google

# Pagos
MP_ACCESS_TOKEN=tu-mercadopago-access-token
STRIPE_SECRET_KEY=tu-stripe-secret-key

# URLs y Dominios
BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOWED_HOSTS=localhost,127.0.0.1

# Redis (Opcional)
REDIS_URL=redis://localhost:6379/0

# Logging
LOG_LEVEL=INFO
```

---

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto

```
backend-FastAPI/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicación principal
│   ├── main_secure.py       # Aplicación con seguridad mejorada
│   ├── api/                 # Endpoints de API
│   │   ├── v1/             # Versión 1 de la API
│   │   ├── routes.py       # Rutas principales
│   │   └── payment_routes.py
│   ├── core/               # Configuraciones centrales
│   │   ├── config.py       # Configuración general
│   │   ├── authorization.py # Sistema de roles
│   │   ├── rate_limiting.py # Control de límites
│   │   ├── security_headers.py
│   │   └── logging_config.py
│   ├── models/             # Modelos de base de datos
│   │   ├── user.py
│   │   ├── video.py
│   │   ├── plan.py
│   │   └── role.py
│   ├── services/           # Lógica de negocio
│   │   ├── auth_service.py
│   │   ├── youtube_service.py
│   │   ├── ffmpeg_service.py
│   │   └── payment_service.py
│   ├── utils/              # Utilidades
│   │   ├── sanitization.py
│   │   └── helpers.py
│   └── db/                 # Base de datos
│       └── session.py
├── scripts/                # Scripts de administración
├── tests/                  # Tests automatizados
├── docs/                   # Documentación
├── logs/                   # Archivos de log
└── ssl/                    # Certificados SSL
```

### Componentes Principales

1. **API Layer**: Endpoints RESTful con FastAPI
2. **Authentication**: JWT con roles (Admin/Cliente)
3. **Business Logic**: Services para cada dominio
4. **Data Layer**: SQLAlchemy con PostgreSQL
5. **Security**: Middlewares de seguridad y sanitización
6. **Monitoring**: Logging estructurado y métricas

---

## 🔐 Autenticación y Autorización

### Sistema de Roles

La aplicación maneja dos roles principales:

- **🔧 Administrador (Admin)**: Acceso completo al sistema
- **👤 Cliente**: Acceso limitado a sus recursos

### Flujo de Autenticación

1. **Registro de Usuario**
2. **Login con Credenciales**
3. **Obtención de Token JWT**
4. **Autorización por Endpoint**

### Ejemplo de Uso de Autenticación

```python
from app.core.authorization import admin_required, require_roles, Role

# Endpoint solo para administradores
@router.get("/admin/users")
async def get_all_users(current_user = Depends(admin_required())):
    return {"users": "data"}

# Endpoint para múltiples roles
@router.get("/dashboard")
async def dashboard(current_user = Depends(require_roles([Role.ADMIN, Role.CLIENT]))):
    return {"dashboard": "data"}
```

---

## 📡 API Endpoints

### Autenticación

| Método | Endpoint                | Descripción         | Roles       |
| ------ | ----------------------- | ------------------- | ----------- |
| POST   | `/api/v1/auth/register` | Registro de usuario | Público     |
| POST   | `/api/v1/auth/login`    | Inicio de sesión    | Público     |
| POST   | `/api/v1/auth/refresh`  | Renovar token       | Autenticado |
| POST   | `/api/v1/auth/logout`   | Cerrar sesión       | Autenticado |

### Gestión de Videos

| Método | Endpoint                      | Descripción         | Roles       |
| ------ | ----------------------------- | ------------------- | ----------- |
| GET    | `/api/v1/videos`              | Listar videos       | Cliente+    |
| POST   | `/api/v1/videos/upload`       | Subir video         | Cliente+    |
| PUT    | `/api/v1/videos/{id}`         | Actualizar video    | Propietario |
| DELETE | `/api/v1/videos/{id}`         | Eliminar video      | Propietario |
| POST   | `/api/v1/videos/{id}/publish` | Publicar en YouTube | Cliente+    |

### YouTube Integration

| Método | Endpoint                   | Descripción           | Roles    |
| ------ | -------------------------- | --------------------- | -------- |
| GET    | `/api/v1/youtube/auth`     | Autorización YouTube  | Cliente+ |
| GET    | `/api/v1/youtube/callback` | Callback OAuth        | Sistema  |
| GET    | `/api/v1/youtube/channels` | Canales vinculados    | Cliente+ |
| POST   | `/api/v1/youtube/schedule` | Programar publicación | Cliente+ |

### Suscripciones y Pagos

| Método | Endpoint                       | Descripción        | Roles    |
| ------ | ------------------------------ | ------------------ | -------- |
| GET    | `/api/v1/plans`                | Planes disponibles | Público  |
| POST   | `/api/v1/payments/create`      | Crear pago         | Cliente+ |
| POST   | `/api/v1/payments/webhook`     | Webhook pagos      | Sistema  |
| GET    | `/api/v1/subscriptions/status` | Estado suscripción | Cliente+ |

### Administración

| Método | Endpoint                    | Descripción           | Roles |
| ------ | --------------------------- | --------------------- | ----- |
| GET    | `/api/v1/admin/users`       | Gestionar usuarios    | Admin |
| GET    | `/api/v1/admin/analytics`   | Analytics del sistema | Admin |
| POST   | `/api/v1/admin/maintenance` | Modo mantenimiento    | Admin |

### Salud y Monitoreo

| Método | Endpoint   | Descripción         | Roles   |
| ------ | ---------- | ------------------- | ------- |
| GET    | `/health`  | Estado básico       | Público |
| GET    | `/ready`   | Readiness probe     | Público |
| GET    | `/live`    | Liveness probe      | Público |
| GET    | `/metrics` | Métricas Prometheus | Admin   |

---

## 👥 Flujo de Usuario

### 1. Registro y Configuración Inicial

```mermaid
graph TD
    A[Usuario Visita Plataforma] --> B[Registro]
    B --> C[Confirmación Email]
    C --> D[Selección Plan]
    D --> E[Configuración Perfil]
    E --> F[Conexión YouTube]
```

### 2. Proceso de Subida de Video

```mermaid
graph TD
    A[Seleccionar Video] --> B[Upload al Servidor]
    B --> C[Procesamiento FFmpeg]
    C --> D[Extracción Metadatos]
    D --> E[Configuración Publicación]
    E --> F[Programar/Publicar Inmediato]
    F --> G[Subida a YouTube]
    G --> H[Notificación Usuario]
```

### 3. Gestión de Contenido

```mermaid
graph TD
    A[Dashboard Usuario] --> B[Biblioteca Videos]
    B --> C[Video Seleccionado]
    C --> D{Acción}
    D -->|Editar| E[Modificar Metadatos]
    D -->|Programar| F[Configurar Horario]
    D -->|Analizar| G[Ver Estadísticas]
    D -->|Eliminar| H[Confirmar Eliminación]
```

---

## 🚢 Despliegue

### Despliegue con Docker (Recomendado)

```bash
# 1. Construir y ejecutar con Docker Compose
docker-compose -f docker-compose.secure.yml up -d

# 2. Verificar servicios
docker-compose ps

# 3. Ver logs
docker-compose logs -f api
```

### Despliegue en Producción

```bash
# 1. Configurar variables de entorno de producción
export ENVIRONMENT=production
export SECRET_KEY="tu-clave-super-secreta"
export DATABASE_URL="postgresql://user:pass@db:5432/video_programmer"

# 2. Ejecutar migraciones
alembic upgrade head

# 3. Inicializar datos
python scripts/initialize_roles.py
python scripts/initialize_plans.py

# 4. Ejecutar con Gunicorn
gunicorn app.main_secure:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Variables de Entorno de Producción

```env
ENVIRONMENT=production
SECRET_KEY=clave-super-secreta-production-minimo-32-chars
DATABASE_URL=postgresql://user:pass@prod-db:5432/video_programmer
REDIS_URL=redis://prod-redis:6379/0
CORS_ORIGINS=https://tu-dominio.com
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
LOG_LEVEL=INFO
```

---

## 🛡️ Seguridad

### Características de Seguridad Implementadas

1. **🔒 HTTPS Obligatorio**: Redirección automática y HSTS
2. **🎫 Autenticación JWT**: Tokens seguros con expiración
3. **👮 Autorización por Roles**: Control granular de acceso
4. **⏱️ Rate Limiting**: Prevención de ataques de fuerza bruta
5. **🧼 Sanitización de Datos**: Prevención de XSS e inyecciones
6. **📋 Headers de Seguridad**: CSP, HSTS, X-Frame-Options
7. **📝 Logging de Seguridad**: Auditoría completa de acciones

### Mejores Prácticas

```python
# Ejemplo de endpoint seguro
@router.post("/videos/upload")
async def upload_video(
    file: UploadFile,
    metadata: VideoMetadata,  # Modelo con sanitización automática
    current_user = Depends(authenticated_user())  # Autenticación requerida
):
    # Validar archivo
    file_info = validate_file_upload(file, FileValidationConfig(
        max_size_mb=100,
        allowed_extensions=[".mp4", ".avi", ".mov"],
        allowed_mime_types=["video/mp4", "video/avi", "video/quicktime"]
    ))

    # Log de auditoría
    log_user_action(
        user_id=current_user.id,
        action="video_upload",
        resource="video",
        filename=file_info["safe_filename"]
    )

    # Procesar video...
```

### Configuración de Seguridad

```python
# Headers de seguridad automáticos
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# Rate limiting por endpoint
@router.post("/auth/login")
@rate_limit(requests_per_minute=5, window_size=300)  # 5 intentos por 5 minutos
async def login(credentials: LoginData):
    # Lógica de login...
```

---

## 📊 Monitoreo y Logs

### Estructura de Logs

```json
{
  "timestamp": "2024-03-15T10:30:00Z",
  "level": "INFO",
  "logger": "app.api.routes",
  "function": "upload_video",
  "line": 125,
  "message": "Video uploaded successfully",
  "extra": {
    "user_id": "123",
    "request_id": "req_abc123",
    "video_id": "vid_xyz789",
    "file_size": "50MB"
  }
}
```

### Tipos de Logs

1. **📥 Access Logs**: Todas las requests HTTP
2. **❌ Error Logs**: Errores y excepciones
3. **🔍 Audit Logs**: Acciones de usuarios críticas
4. **🔒 Security Logs**: Eventos de seguridad

### Métricas de Monitoreo

- **Response Time**: Tiempo de respuesta por endpoint
- **Request Rate**: Requests por segundo
- **Error Rate**: Porcentaje de errores
- **Active Users**: Usuarios conectados
- **Video Processing**: Estado de procesamiento

### Dashboards

```python
# Endpoint de métricas para Prometheus
@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_prometheus_metrics(),
        media_type="text/plain"
    )
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```bash
# Verificar conexión
python -c "from app.db.session import get_db; next(get_db())"

# Error común: SQLALCHEMY_DATABASE_URL incorrecta
# Solución: Verificar .env y string de conexión
```

#### 2. Videos No Se Procesan

```bash
# Verificar FFmpeg
ffmpeg -version

# Verificar permisos de directorio
ls -la videos/ output/

# Revisar logs
tail -f logs/error.log
```

#### 3. Autenticación YouTube Falla

```bash
# Verificar credenciales OAuth
python scripts/test_oauth.py

# Verificar redirect URI en Google Console
```

#### 4. Rate Limiting Muy Estricto

```python
# Ajustar configuración en main_secure.py
app.add_middleware(
    RateLimitMiddleware,
    default_requests_per_minute=120,  # Aumentar límite
    authenticated_requests_per_minute=200
)
```

### Comandos de Diagnóstico

```bash
# Ver estado de la aplicación
curl http://localhost:8000/health

# Probar autenticación
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Verificar headers de seguridad
curl -I http://localhost:8000/health

# Ver métricas
curl http://localhost:8000/metrics
```

---

## 📚 Manual de Usuario

### Para Administradores

#### Gestión de Usuarios

1. **Acceder al Panel Admin**

   ```
   GET /api/v1/admin/users
   Authorization: Bearer {admin_token}
   ```

2. **Ver Analytics del Sistema**

   ```
   GET /api/v1/admin/analytics
   ```

3. **Gestionar Planes de Suscripción**

   ```
   POST /api/v1/admin/plans
   Content-Type: application/json

   {
     "name": "Premium",
     "price": 29.99,
     "features": ["unlimited_uploads", "priority_processing"]
   }
   ```

#### Monitoreo del Sistema

```bash
# Ver logs en tiempo real
tail -f logs/access.log | jq '.'

# Verificar estado de servicios
docker-compose ps

# Métricas de rendimiento
curl http://localhost:8000/metrics | grep response_time
```

### Para Desarrolladores

#### Agregar Nuevo Endpoint

```python
# 1. Crear endpoint en api/v1/
@router.post("/new-feature")
async def new_feature(
    data: NewFeatureRequest,
    current_user = Depends(authenticated_user())
):
    # Validar datos
    # Procesar lógica
    # Retornar respuesta
    pass

# 2. Agregar tests
def test_new_feature():
    response = client.post("/api/v1/new-feature", json=test_data)
    assert response.status_code == 200

# 3. Documentar endpoint
```

#### Configurar Nuevo Middleware

```python
# En main_secure.py
app.add_middleware(
    CustomMiddleware,
    setting1="value1",
    setting2="value2"
)
```

### Para Usuarios Finales

#### Subir y Programar Video

```javascript
// Frontend JavaScript
const uploadVideo = async (file, metadata) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", metadata.title);
  formData.append("description", metadata.description);

  const response = await fetch("/api/v1/videos/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
    body: formData,
  });

  return response.json();
};
```

#### Conectar Canal de YouTube

```javascript
// Iniciar proceso OAuth
window.location.href = "/api/v1/youtube/auth";

// Después del callback, verificar conexión
const checkYouTubeConnection = async () => {
  const response = await fetch("/api/v1/youtube/channels", {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });
  return response.json();
};
```

#### Gestionar Suscripción

```javascript
// Ver planes disponibles
const getPlans = async () => {
  const response = await fetch("/api/v1/plans");
  return response.json();
};

// Crear pago
const createPayment = async (planId) => {
  const response = await fetch("/api/v1/payments/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ plan_id: planId }),
  });
  return response.json();
};
```

---

## 📞 Soporte y Contacto

### Recursos de Ayuda

- **📖 Documentación**: [docs.video-programmer.com]
- **🐛 Issues**: [github.com/Beto18v/Video-Programmer/issues]
- **💬 Discord**: [discord.gg/video-programmer]
- **📧 Email**: [soporte@video-programmer.com]

### Contribuciones

1. Fork el repositorio
2. Crea una rama para tu feature
3. Implementa los cambios
4. Agrega tests
5. Envía un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

_Documentación actualizada el 23 de Octubre, 2025_
