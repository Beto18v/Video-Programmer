# 📺 YouTube API Integration - Video Programmer

## 🌐 Descripción General

La integración con YouTube API permite automatizar la publicación, gestión y análisis de videos en canales de YouTube. Utiliza OAuth2 para autenticación y la YouTube Data API v3 para operaciones.

## 🔧 Configuración Inicial

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la YouTube Data API v3
4. Crea credenciales OAuth 2.0

### 2. Configurar OAuth Consent Screen

```json
{
  "client_id": "your-client-id.apps.googleusercontent.com",
  "project_id": "your-project-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_secret": "your-client-secret",
  "redirect_uris": [
    "http://localhost:8000/api/v1/oauth2/callback/google",
    "https://your-domain.com/api/v1/oauth2/callback/google"
  ],
  "scopes": [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly"
  ]
}
```

### 3. Variables de Entorno

```bash
# .env
YOUTUBE_CLIENT_ID=your-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-client-secret
YOUTUBE_REDIRECT_URI=https://your-domain.com/api/v1/oauth2/callback/google
```

## 🔄 Flujo de Autenticación OAuth2

### 1. Iniciar Autorización

```http
GET /api/v1/youtube/auth
Authorization: Bearer <user_token>
```

**Respuesta:** Redirección a Google OAuth2

### 2. Callback de Autorización

```http
GET /api/v1/oauth2/callback/google?code=<auth_code>&state=<state>
```

**Procesamiento interno:**

1. Intercambiar código por tokens
2. Almacenar tokens encriptados en BD
3. Asociar tokens con usuario

### 3. Refresh Token

Los tokens se refrescan automáticamente cuando expiran.

## 📤 Publicación de Videos

### Endpoint Principal

```http
POST /api/v1/videos/{video_id}/publish
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "channel_id": "UC1234567890",
  "privacy": "public",
  "title": "Mi Video Automático",
  "description": "Publicado automáticamente por Video Programmer",
  "tags": ["tutorial", "automatización"],
  "category_id": "22",
  "publish_at": "2024-03-20T15:00:00Z",
  "made_for_kids": false
}
```

### Parámetros Detallados

| Parámetro       | Tipo     | Requerido | Descripción                      |
| --------------- | -------- | --------- | -------------------------------- |
| `channel_id`    | string   | ✅        | ID del canal de YouTube          |
| `privacy`       | enum     | ✅        | `public`, `private`, `unlisted`  |
| `title`         | string   | ✅        | Título del video (máx 100 chars) |
| `description`   | string   | ❌        | Descripción (máx 5000 chars)     |
| `tags`          | array    | ❌        | Tags del video (máx 500)         |
| `category_id`   | string   | ❌        | ID de categoría de YouTube       |
| `publish_at`    | datetime | ❌        | Fecha de publicación programada  |
| `made_for_kids` | boolean  | ❌        | Contenido para niños             |

### Categorías de YouTube

```javascript
const YOUTUBE_CATEGORIES = {
  1: "Film & Animation",
  2: "Autos & Vehicles",
  10: "Music",
  15: "Pets & Animals",
  17: "Sports",
  18: "Short Movies",
  19: "Travel & Events",
  20: "Gaming",
  21: "Videoblogging",
  22: "People & Blogs",
  23: "Comedy",
  24: "Entertainment",
  25: "News & Politics",
  26: "Howto & Style",
  27: "Education",
  28: "Science & Technology",
  29: "Nonprofits & Activism",
  30: "Movies",
  31: "Anime/Animation",
  32: "Action/Adventure",
  33: "Classics",
  34: "Comedy",
  35: "Documentary",
  36: "Drama",
  37: "Family",
  38: "Foreign",
  39: "Horror",
  40: "Sci-Fi/Fantasy",
  41: "Thriller",
  42: "Shorts",
  43: "Shows",
  44: "Trailers",
};
```

## 📊 Gestión de Canales

### Listar Canales Conectados

```http
GET /api/v1/youtube/channels
Authorization: Bearer <user_token>
```

**Respuesta:**

```json
{
  "channels": [
    {
      "id": "UC1234567890",
      "title": "Mi Canal Principal",
      "description": "Canal sobre tecnología",
      "subscriber_count": 15400,
      "video_count": 245,
      "view_count": 1250000,
      "connected_at": "2024-03-15T10:30:00Z",
      "status": "active"
    }
  ]
}
```

### Información de Canal

```http
GET /api/v1/youtube/channels/{channel_id}
Authorization: Bearer <user_token>
```

**Respuesta:**

```json
{
  "id": "UC1234567890",
  "title": "Mi Canal",
  "description": "Descripción del canal",
  "published_at": "2020-01-01T00:00:00Z",
  "subscriber_count": 15400,
  "video_count": 245,
  "view_count": 1250000,
  "country": "US",
  "default_language": "es",
  "featured_channels": ["UC9876543210"],
  "keywords": ["tecnología", "programación"],
  "banner_url": "https://yt3.ggpht.com/banner.jpg",
  "thumbnail_url": "https://yt3.ggpht.com/avatar.jpg"
}
```

## 📈 Analytics y Estadísticas

### Estadísticas de Video

```http
GET /api/v1/youtube/videos/{youtube_video_id}/analytics
Authorization: Bearer <user_token>
```

**Respuesta:**

```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Mi Video",
  "published_at": "2024-03-15T10:30:00Z",
  "statistics": {
    "view_count": 1250,
    "like_count": 89,
    "dislike_count": 5,
    "favorite_count": 12,
    "comment_count": 34
  },
  "engagement_rate": 7.2,
  "average_view_duration": 180,
  "impressions": 5000,
  "click_through_rate": 25.0
}
```

### Analytics de Canal

```http
GET /api/v1/youtube/channels/{channel_id}/analytics?period=30d
Authorization: Bearer <user_token>
```

**Parámetros:**

- `period`: `7d`, `30d`, `90d`, `1y`

**Respuesta:**

```json
{
  "period": "30d",
  "subscriber_gained": 150,
  "subscriber_lost": 25,
  "net_subscriber_change": 125,
  "views": 45000,
  "estimated_minutes_watched": 67500,
  "average_view_duration": 90,
  "videos_published": 8,
  "top_videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "Video Popular",
      "views": 5000,
      "engagement_rate": 8.5
    }
  ]
}
```

## ⏰ Programación de Publicaciones

### Crear Programación Recurrente

```http
POST /api/v1/youtube/schedule
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "video_id": "vid_123",
  "channel_id": "UC1234567890",
  "recurring": {
    "frequency": "weekly",
    "day_of_week": "monday",
    "time": "10:00",
    "timezone": "America/Buenos_Aires"
  },
  "template": {
    "title_template": "Tutorial #{number}: {topic}",
    "description_template": "Aprende {topic} en este tutorial...",
    "tags": ["tutorial", "programación"],
    "privacy": "public"
  }
}
```

### Ver Calendario

```http
GET /api/v1/youtube/schedule?start_date=2024-03-01&end_date=2024-03-31
Authorization: Bearer <user_token>
```

**Respuesta:**

```json
{
  "scheduled_videos": [
    {
      "id": "sch_123",
      "video_id": "vid_456",
      "channel_id": "UC1234567890",
      "scheduled_for": "2024-03-18T10:00:00-03:00",
      "status": "pending",
      "recurring": true,
      "next_run": "2024-03-25T10:00:00-03:00"
    }
  ]
}
```

## 🔍 Búsqueda y Descubrimiento

### Buscar Videos en Canal

```http
GET /api/v1/youtube/channels/{channel_id}/videos?query=tutorial&page=1&limit=10
Authorization: Bearer <user_token>
```

**Parámetros:**

- `query`: Término de búsqueda
- `order`: `date`, `rating`, `relevance`, `title`, `viewCount`
- `page`: Número de página
- `limit`: Videos por página (máx 50)

### Buscar en YouTube

```http
GET /api/v1/youtube/search?q=python+tutorial&type=video&max_results=25
Authorization: Bearer <user_token>
```

## 🛠️ Gestión de Comentarios

### Listar Comentarios

```http
GET /api/v1/youtube/videos/{youtube_video_id}/comments?page=1&limit=20
Authorization: Bearer <user_token>
```

### Responder Comentario

```http
POST /api/v1/youtube/comments/{comment_id}/reply
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "text": "¡Gracias por tu comentario! Me alegra que te haya gustado."
}
```

### Moderar Comentarios

```http
POST /api/v1/youtube/comments/{comment_id}/moderate
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "action": "approve", // "approve", "reject", "delete"
  "reason": "Comentario inapropiado"
}
```

## 📋 Playlists

### Crear Playlist

```http
POST /api/v1/youtube/playlists
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "channel_id": "UC1234567890",
  "title": "Tutoriales de Python",
  "description": "Colección completa de tutoriales",
  "privacy": "public",
  "tags": ["python", "tutorial"]
}
```

### Agregar Video a Playlist

```http
POST /api/v1/youtube/playlists/{playlist_id}/videos
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "video_id": "dQw4w9WgXcQ",
  "position": 1
}
```

## ⚠️ Manejo de Errores

### Errores Comunes de YouTube API

```javascript
const YOUTUBE_ERRORS = {
  uploadLimitExceeded: {
    message: "Has excedido el límite de subida diario",
    solution: "Espera 24 horas o actualiza tu canal verificado",
  },
  forbidden: {
    message: "No tienes permisos para esta operación",
    solution: "Verifica que tu canal esté conectado y tengas permisos",
  },
  quotaExceeded: {
    message: "Has excedido la cuota de la API",
    solution: "Espera a que se renueve la cuota o solicita aumento",
  },
  videoNotFound: {
    message: "Video no encontrado",
    solution: "Verifica el ID del video",
  },
};
```

### Rate Limiting

YouTube API tiene límites de cuota:

- **Daily quota**: 10,000 unidades por día
- **Per 100 seconds**: 30,000 unidades

**Costos por operación:**

- Upload video: 1600 unidades
- Update video: 50 unidades
- List videos: 1 unidad
- Get analytics: 1 unidad

## 🔄 Webhooks y Notificaciones

### Configurar Webhooks

```http
POST /api/v1/youtube/webhooks
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "channel_id": "UC1234567890",
  "events": ["video.uploaded", "video.processed", "comment.new"],
  "webhook_url": "https://your-app.com/webhooks/youtube"
}
```

### Eventos Disponibles

- `video.uploaded`: Nuevo video subido
- `video.processed`: Video procesado completamente
- `video.failed`: Error en procesamiento
- `comment.new`: Nuevo comentario
- `analytics.update`: Actualización de estadísticas

## 📊 Monitoreo de Integración

### Estado de Conexión

```http
GET /api/v1/youtube/status
Authorization: Bearer <user_token>
```

**Respuesta:**

```json
{
  "overall_status": "healthy",
  "channels": [
    {
      "id": "UC1234567890",
      "status": "connected",
      "last_sync": "2024-03-15T10:30:00Z",
      "quota_remaining": 8500,
      "quota_reset": "2024-03-16T00:00:00Z"
    }
  ]
}
```

### Logs de Integración

```http
GET /api/v1/youtube/logs?level=error&since=2024-03-14
Authorization: Bearer <user_token>
```

---

_Documentación YouTube API - Octubre 2025_
