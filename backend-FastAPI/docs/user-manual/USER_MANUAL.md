# 👥 Manual de Usuario - Video Programmer API

## 📋 Índice

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Autenticación](#autenticación)
4. [Gestión de Videos](#gestión-de-videos)
5. [Integración con YouTube](#integración-con-youtube)
6. [Planes y Suscripciones](#planes-y-suscripciones)
7. [Panel de Administración](#panel-de-administración)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🌟 Introducción

Video Programmer API es una plataforma completa que automatiza la gestión, procesamiento y publicación de videos en YouTube. Este manual te guiará a través de todas las funcionalidades disponibles.

### ¿Qué puedes hacer?

- 📹 **Subir y procesar videos** automáticamente
- 🎯 **Programar publicaciones** en YouTube
- 👥 **Gestionar múltiples canales** de YouTube
- 💰 **Gestionar suscripciones** y planes de pago
- 📊 **Monitorear el rendimiento** de tus videos
- 🔐 **Seguridad avanzada** con roles y permisos

---

## 🚀 Primeros Pasos

### 1. Acceso a la Plataforma

La API está disponible en: `https://api.video-programmer.com`

**Documentación interactiva**: `https://api.video-programmer.com/docs`

### 2. Registro de Usuario

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura",
  "name": "Juan Pérez"
}
```

**Respuesta exitosa:**

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

### 3. Verificación de Email

Después del registro, recibirás un email de verificación. Haz clic en el enlace para activar tu cuenta.

---

## 🔐 Autenticación

### Inicio de Sesión

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura"
}
```

**Respuesta:**

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

### Usar el Token

Incluye el token en todas las requests autenticadas:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Renovar Token

```http
POST /api/v1/auth/refresh
Authorization: Bearer tu_token_actual
```

---

## 📹 Gestión de Videos

### 1. Subir Video

```http
POST /api/v1/videos/upload
Authorization: Bearer tu_token
Content-Type: multipart/form-data

file: (archivo de video)
title: "Mi Primer Video"
description: "Descripción del video"
tags: ["tutorial", "programación"]
```

**Respuesta:**

```json
{
  "id": "vid_123",
  "title": "Mi Primer Video",
  "status": "processing",
  "duration": 180,
  "file_size": "50MB",
  "upload_progress": 100,
  "processing_progress": 0,
  "created_at": "2024-03-15T10:30:00Z"
}
```

### 2. Ver Estado de Procesamiento

```http
GET /api/v1/videos/vid_123/status
Authorization: Bearer tu_token
```

**Respuesta:**

```json
{
  "id": "vid_123",
  "status": "completed",
  "processing_progress": 100,
  "thumbnail_url": "https://cdn.video-programmer.com/thumbnails/vid_123.jpg",
  "processed_formats": ["720p", "1080p"],
  "estimated_completion": null
}
```

### 3. Listar Videos

```http
GET /api/v1/videos?page=1&limit=10&status=completed
Authorization: Bearer tu_token
```

**Respuesta:**

```json
{
  "videos": [
    {
      "id": "vid_123",
      "title": "Mi Primer Video",
      "status": "completed",
      "duration": 180,
      "views": 1250,
      "created_at": "2024-03-15T10:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 4. Actualizar Metadatos

```http
PUT /api/v1/videos/vid_123
Authorization: Bearer tu_token
Content-Type: application/json

{
  "title": "Título Actualizado",
  "description": "Nueva descripción",
  "tags": ["tutorial", "programación", "python"]
}
```

### 5. Eliminar Video

```http
DELETE /api/v1/videos/vid_123
Authorization: Bearer tu_token
```

---

## 🎬 Integración con YouTube

### 1. Conectar Canal de YouTube

```http
GET /api/v1/youtube/auth
Authorization: Bearer tu_token
```

Esto te redirigirá a Google para autorizar el acceso a tu canal de YouTube.

### 2. Ver Canales Conectados

```http
GET /api/v1/youtube/channels
Authorization: Bearer tu_token
```

**Respuesta:**

```json
{
  "channels": [
    {
      "id": "UC123456789",
      "title": "Mi Canal",
      "subscriber_count": 15400,
      "video_count": 245,
      "connected_at": "2024-03-15T10:30:00Z"
    }
  ]
}
```

### 3. Publicar Video en YouTube

```http
POST /api/v1/videos/vid_123/publish
Authorization: Bearer tu_token
Content-Type: application/json

{
  "channel_id": "UC123456789",
  "privacy": "public",
  "publish_at": "2024-03-16T14:00:00Z",
  "category_id": "22",
  "made_for_kids": false
}
```

**Respuesta:**

```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "status": "scheduled",
  "scheduled_for": "2024-03-16T14:00:00Z",
  "youtube_url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### 4. Programar Publicación

```http
POST /api/v1/youtube/schedule
Authorization: Bearer tu_token
Content-Type: application/json

{
  "video_id": "vid_123",
  "channel_id": "UC123456789",
  "publish_at": "2024-03-20T10:00:00Z",
  "recurring": {
    "frequency": "weekly",
    "day_of_week": "monday",
    "time": "10:00"
  }
}
```

### 5. Ver Calendario de Publicaciones

```http
GET /api/v1/youtube/schedule?start_date=2024-03-15&end_date=2024-03-22
Authorization: Bearer tu_token
```

**Respuesta:**

```json
{
  "scheduled_videos": [
    {
      "video_id": "vid_123",
      "title": "Mi Primer Video",
      "scheduled_for": "2024-03-16T14:00:00Z",
      "channel": "Mi Canal",
      "status": "pending"
    }
  ]
}
```

---

## 💰 Planes y Suscripciones

### 1. Ver Planes Disponibles

```http
GET /api/v1/plans
```

**Respuesta:**

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
        "youtube_channels": 1,
        "priority_processing": false
      }
    },
    {
      "id": "plan_pro",
      "name": "Profesional",
      "price": 29.99,
      "currency": "USD",
      "interval": "monthly",
      "features": {
        "max_videos_per_month": 100,
        "max_storage_gb": 50,
        "youtube_channels": 5,
        "priority_processing": true
      }
    }
  ]
}
```

### 2. Suscribirse a un Plan

```http
POST /api/v1/subscriptions/subscribe
Authorization: Bearer tu_token
Content-Type: application/json

{
  "plan_id": "plan_pro",
  "payment_method": "mercadopago"
}
```

**Respuesta:**

```json
{
  "subscription_id": "sub_123",
  "payment_url": "https://mercadopago.com/checkout/v1/redirect?pref_id=123",
  "status": "pending_payment"
}
```

### 3. Ver Estado de Suscripción

```http
GET /api/v1/subscriptions/status
Authorization: Bearer tu_token
```

**Respuesta:**

```json
{
  "subscription": {
    "id": "sub_123",
    "plan": "Profesional",
    "status": "active",
    "current_period_end": "2024-04-15T10:30:00Z",
    "usage": {
      "videos_uploaded": 15,
      "storage_used_gb": 12.5,
      "videos_limit": 100,
      "storage_limit_gb": 50
    }
  }
}
```

### 4. Cancelar Suscripción

```http
POST /api/v1/subscriptions/cancel
Authorization: Bearer tu_token
Content-Type: application/json

{
  "reason": "No longer needed",
  "cancel_at_period_end": true
}
```

---

## 👑 Panel de Administración

### 1. Ver Todos los Usuarios (Solo Admin)

```http
GET /api/v1/admin/users?page=1&limit=20
Authorization: Bearer admin_token
```

**Respuesta:**

```json
{
  "users": [
    {
      "id": 123,
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "role": "cliente",
      "subscription": "Profesional",
      "last_login": "2024-03-15T10:30:00Z",
      "videos_count": 15
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20
}
```

### 2. Analytics del Sistema

```http
GET /api/v1/admin/analytics
Authorization: Bearer admin_token
```

**Respuesta:**

```json
{
  "users": {
    "total": 1250,
    "active_today": 145,
    "new_this_month": 67
  },
  "videos": {
    "total": 12450,
    "processed_today": 234,
    "storage_used_gb": 2340
  },
  "revenue": {
    "mrr": 15750.5,
    "new_subscriptions": 23,
    "churned_subscriptions": 8
  }
}
```

### 3. Gestionar Usuario

```http
PUT /api/v1/admin/users/123
Authorization: Bearer admin_token
Content-Type: application/json

{
  "is_active": false,
  "role": "admin",
  "notes": "Usuario promovido a administrador"
}
```

### 4. Modo Mantenimiento

```http
POST /api/v1/admin/maintenance
Authorization: Bearer admin_token
Content-Type: application/json

{
  "enabled": true,
  "message": "Mantenimiento programado. Volveremos en 30 minutos.",
  "estimated_end": "2024-03-15T12:00:00Z"
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Flujo Completo de Subida y Publicación

```python
import requests
import json

# 1. Login
login_response = requests.post('https://api.video-programmer.com/api/v1/auth/login',
    json={'email': 'usuario@ejemplo.com', 'password': 'contraseña'})
token = login_response.json()['access_token']

headers = {'Authorization': f'Bearer {token}'}

# 2. Subir video
with open('mi_video.mp4', 'rb') as video_file:
    files = {'file': video_file}
    data = {
        'title': 'Tutorial de Python',
        'description': 'Aprende Python desde cero',
        'tags': ['python', 'tutorial', 'programación']
    }
    upload_response = requests.post(
        'https://api.video-programmer.com/api/v1/videos/upload',
        headers=headers,
        files=files,
        data=data
    )

video_id = upload_response.json()['id']

# 3. Esperar procesamiento
import time
while True:
    status_response = requests.get(
        f'https://api.video-programmer.com/api/v1/videos/{video_id}/status',
        headers=headers
    )
    status = status_response.json()['status']
    if status == 'completed':
        break
    time.sleep(10)

# 4. Publicar en YouTube
publish_response = requests.post(
    f'https://api.video-programmer.com/api/v1/videos/{video_id}/publish',
    headers=headers,
    json={
        'channel_id': 'UC123456789',
        'privacy': 'public',
        'publish_at': '2024-03-16T14:00:00Z'
    }
)

print(f"Video publicado: {publish_response.json()['youtube_url']}")
```

### Ejemplo 2: Monitoreo de Progreso con JavaScript

```javascript
class VideoManager {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
  }

  async uploadVideo(file, metadata) {
    const formData = new FormData();
    formData.append("file", file);
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });

    const response = await fetch(`${this.apiUrl}/api/v1/videos/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async waitForProcessing(videoId, onProgress) {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await fetch(
            `${this.apiUrl}/api/v1/videos/${videoId}/status`,
            {
              headers: { Authorization: `Bearer ${this.token}` },
            }
          );
          const data = await response.json();

          onProgress(data.processing_progress);

          if (data.status === "completed") {
            resolve(data);
          } else if (data.status === "error") {
            reject(new Error("Processing failed"));
          } else {
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };
      checkStatus();
    });
  }
}

// Uso
const manager = new VideoManager(
  "https://api.video-programmer.com",
  "tu_token"
);

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("video-file").files[0];
  const metadata = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
  };

  try {
    // Subir video
    const uploadResult = await manager.uploadVideo(file, metadata);
    console.log("Video subido:", uploadResult);

    // Monitorear progreso
    await manager.waitForProcessing(uploadResult.id, (progress) => {
      document.getElementById("progress").style.width = `${progress}%`;
    });

    console.log("Procesamiento completado");
  } catch (error) {
    console.error("Error:", error);
  }
});
```

### Ejemplo 3: Gestión de Suscripciones

```python
class SubscriptionManager:
    def __init__(self, api_url, token):
        self.api_url = api_url
        self.headers = {'Authorization': f'Bearer {token}'}

    def get_available_plans(self):
        response = requests.get(f'{self.api_url}/api/v1/plans')
        return response.json()['plans']

    def subscribe_to_plan(self, plan_id):
        response = requests.post(
            f'{self.api_url}/api/v1/subscriptions/subscribe',
            headers=self.headers,
            json={'plan_id': plan_id, 'payment_method': 'mercadopago'}
        )
        return response.json()

    def get_subscription_status(self):
        response = requests.get(
            f'{self.api_url}/api/v1/subscriptions/status',
            headers=self.headers
        )
        return response.json()['subscription']

    def check_usage_limits(self):
        subscription = self.get_subscription_status()
        usage = subscription['usage']

        return {
            'videos_remaining': usage['videos_limit'] - usage['videos_uploaded'],
            'storage_remaining_gb': usage['storage_limit_gb'] - usage['storage_used_gb'],
            'can_upload': usage['videos_uploaded'] < usage['videos_limit']
        }

# Uso
manager = SubscriptionManager('https://api.video-programmer.com', 'tu_token')

# Verificar límites antes de subir
limits = manager.check_usage_limits()
if limits['can_upload']:
    print(f"Puedes subir {limits['videos_remaining']} videos más este mes")
else:
    print("Has alcanzado el límite de videos para este mes")
```

---

## 🛠️ Solución de Problemas

### Error 401: No autorizado

**Problema**: Token inválido o expirado

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Token inválido o expirado"
  }
}
```

**Solución**:

1. Verificar que el token esté incluido en el header
2. Renovar el token con `/api/v1/auth/refresh`
3. Hacer login nuevamente si es necesario

### Error 403: Acceso denegado

**Problema**: Permisos insuficientes

```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "No tienes permisos para realizar esta acción"
  }
}
```

**Solución**:

1. Verificar que tu rol tenga los permisos necesarios
2. Contactar al administrador si necesitas permisos adicionales

### Error 413: Archivo demasiado grande

**Problema**: Video excede el tamaño máximo

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "El archivo excede el tamaño máximo permitido"
  }
}
```

**Solución**:

1. Comprimir el video antes de subir
2. Verificar los límites de tu plan de suscripción
3. Considerar actualizar a un plan superior

### Error 422: Límite de videos alcanzado

**Problema**: Has alcanzado el límite de tu plan

```json
{
  "error": {
    "code": "BUSINESS_LOGIC_ERROR",
    "message": "Has alcanzado el límite de videos para tu plan actual"
  }
}
```

**Solución**:

1. Esperar al siguiente período de facturación
2. Actualizar a un plan superior
3. Eliminar videos antiguos si tu plan lo permite

### Error 429: Demasiadas solicitudes

**Problema**: Rate limiting activado

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Demasiadas solicitudes. Intenta de nuevo más tarde."
  }
}
```

**Solución**:

1. Esperar el tiempo indicado en el header `Retry-After`
2. Implementar backoff exponencial en tu código
3. Optimizar la frecuencia de requests

### Error de Procesamiento de Video

**Problema**: El video no se procesa correctamente

**Solución**:

1. Verificar que el formato de video sea compatible
2. Asegurar que el archivo no esté corrupto
3. Verificar que el video tenga audio y video válidos

### Problemas de Conexión con YouTube

**Problema**: No se puede conectar el canal de YouTube

**Solución**:

1. Verificar que la OAuth app esté configurada correctamente
2. Asegurar que el redirect URI sea correcto
3. Verificar que el canal de YouTube esté habilitado para API

---

## 📞 Soporte Técnico

### Canales de Soporte

- **📧 Email**: soporte@video-programmer.com
- **💬 Chat en vivo**: Disponible en el panel de usuario
- **📋 Tickets**: Sistema de tickets en el dashboard
- **📖 Documentación**: [docs.video-programmer.com]

### Información para Reportar Problemas

Cuando contactes soporte, incluye:

1. **Request ID**: Disponible en los headers de respuesta
2. **Timestamp**: Cuándo ocurrió el problema
3. **Endpoint**: Qué endpoint estabas usando
4. **Payload**: Datos que enviaste (sin información sensible)
5. **Respuesta de error**: El mensaje de error completo

### Horarios de Soporte

- **Soporte Básico**: 24/7 para clientes de todos los planes
- **Soporte Prioritario**: Respuesta en < 4 horas para clientes Pro
- **Soporte Dedicado**: Respuesta en < 1 hora para clientes Enterprise

---

_Manual actualizado el 23 de Octubre, 2025 - Versión 1.0_
