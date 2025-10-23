# 📋 Referencia de API - Video Programmer

## 🌐 Endpoints Disponibles

### Autenticación

#### POST `/api/v1/auth/register`

Registra un nuevo usuario en la plataforma.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura",
  "name": "Juan Pérez"
}
```

**Response (201):**

```json
{
  "id": 123,
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "role": "cliente",
  "is_active": true,
  "created_at": "2024-03-15T10:30:00Z"
}
```

#### POST `/api/v1/auth/login`

Inicia sesión en la plataforma.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 123,
    "email": "usuario@ejemplo.com",
    "role": "cliente"
  }
}
```

### Gestión de Videos

#### POST `/api/v1/videos/upload`

Sube un nuevo video para procesamiento.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: Archivo de video
- `title`: Título del video
- `description`: Descripción del video
- `tags`: Tags separados por comas

**Response (201):**

```json
{
  "id": "vid_123",
  "title": "Mi Video",
  "status": "processing",
  "upload_progress": 100,
  "processing_progress": 0,
  "created_at": "2024-03-15T10:30:00Z"
}
```

#### GET `/api/v1/videos/{video_id}/status`

Obtiene el estado de procesamiento de un video.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "vid_123",
  "status": "completed",
  "processing_progress": 100,
  "thumbnail_url": "https://cdn.video-programmer.com/thumbnails/vid_123.jpg",
  "processed_formats": ["720p", "1080p"],
  "duration": 180
}
```

### Integración YouTube

#### GET `/api/v1/youtube/auth`

Inicia el flujo de autenticación con YouTube.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (302):** Redirección a Google OAuth2

#### POST `/api/v1/videos/{video_id}/publish`

Publica un video en YouTube.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "channel_id": "UC123456789",
  "privacy": "public",
  "publish_at": "2024-03-16T14:00:00Z",
  "category_id": "22"
}
```

**Response (200):**

```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "status": "scheduled",
  "scheduled_for": "2024-03-16T14:00:00Z",
  "youtube_url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Planes y Suscripciones

#### GET `/api/v1/plans`

Obtiene todos los planes disponibles.

**Response (200):**

```json
{
  "plans": [
    {
      "id": "plan_basic",
      "name": "Básico",
      "price": 9.99,
      "currency": "USD",
      "interval": "monthly",
      "features": {
        "max_videos_per_month": 10,
        "max_storage_gb": 5,
        "youtube_channels": 1
      }
    }
  ]
}
```

#### POST `/api/v1/subscriptions/subscribe`

Suscribe al usuario a un plan.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "plan_id": "plan_pro",
  "payment_method": "mercadopago"
}
```

**Response (200):**

```json
{
  "subscription_id": "sub_123",
  "payment_url": "https://mercadopago.com/checkout/v1/redirect?pref_id=123",
  "status": "pending_payment"
}
```

## 📊 Códigos de Estado

### 2xx - Éxito

- `200`: OK - Solicitud exitosa
- `201`: Created - Recurso creado exitosamente

### 4xx - Error del Cliente

- `400`: Bad Request - Datos inválidos
- `401`: Unauthorized - Token inválido o expirado
- `403`: Forbidden - Permisos insuficientes
- `404`: Not Found - Recurso no encontrado
- `413`: Payload Too Large - Archivo demasiado grande
- `422`: Unprocessable Entity - Validación fallida
- `429`: Too Many Requests - Rate limit excedido

### 5xx - Error del Servidor

- `500`: Internal Server Error - Error interno
- `502`: Bad Gateway - Error de gateway
- `503`: Service Unavailable - Servicio no disponible

## 🔒 Autenticación

Todos los endpoints (excepto registro y login) requieren autenticación JWT:

```
Authorization: Bearer <access_token>
```

Los tokens expiran en 30 minutos. Usa el endpoint `/api/v1/auth/refresh` para renovarlos.

## 📝 Rate Limiting

- **General**: 1000 requests por hora por IP
- **Autenticado**: 5000 requests por hora por usuario
- **Upload**: 10 uploads por hora por usuario
- **Admin**: Sin límite

## 📋 Formatos Soportados

### Videos

- MP4, AVI, MOV, MKV, FLV, WMV
- Máximo: 2GB por archivo
- Resolución máxima: 4K

### Imágenes (Thumbnails)

- JPG, PNG, GIF
- Máximo: 5MB
- Resolución recomendada: 1280x720

---

_Última actualización: Octubre 2025_
