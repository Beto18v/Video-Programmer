# 🚀 Primeros Pasos - Video Programmer

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta de Google (para YouTube)
- ✅ Conocimientos básicos de APIs REST
- ✅ Entorno de desarrollo configurado

## 🎯 Paso 1: Registro y Configuración Inicial

### 1.1 Crear Cuenta

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "tu-email@ejemplo.com",
  "password": "tu_contraseña_segura",
  "name": "Tu Nombre"
}
```

**Respuesta exitosa:**

```json
{
  "id": 123,
  "email": "tu-email@ejemplo.com",
  "name": "Tu Nombre",
  "role": "cliente",
  "is_active": true
}
```

### 1.2 Verificar Email

Revisa tu email y haz clic en el enlace de verificación enviado automáticamente.

### 1.3 Iniciar Sesión

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "tu-email@ejemplo.com",
  "password": "tu_contraseña_segura"
}
```

**Guarda el `access_token`** de la respuesta para usarlo en requests futuras.

## 📹 Paso 2: Subir Tu Primer Video

### 2.1 Preparar el Video

**Requisitos del archivo:**

- ✅ Formato: MP4, AVI, MOV, MKV
- ✅ Tamaño máximo: 2GB
- ✅ Duración: Sin límite
- ✅ Resolución: Hasta 4K

### 2.2 Subir Video

```http
POST /api/v1/videos/upload
Authorization: Bearer TU_ACCESS_TOKEN
Content-Type: multipart/form-data

# Archivo: tu_video.mp4
# Título: Mi Primer Video Automático
# Descripción: Video subido automáticamente con Video Programmer
# Tags: tutorial,programación,automatización
```

**Respuesta:**

```json
{
  "id": "vid_123",
  "title": "Mi Primer Video Automático",
  "status": "processing",
  "upload_progress": 100,
  "processing_progress": 0
}
```

### 2.3 Monitorear Procesamiento

```http
GET /api/v1/videos/vid_123/status
Authorization: Bearer TU_ACCESS_TOKEN
```

Espera hasta que `status` sea `"completed"` y `processing_progress` llegue a 100.

## 🎬 Paso 3: Conectar YouTube

### 3.1 Autorizar Canal

```http
GET /api/v1/youtube/auth
Authorization: Bearer TU_ACCESS_TOKEN
```

Esto te redirigirá a Google para autorizar el acceso a tu canal de YouTube.

### 3.2 Ver Canales Conectados

```http
GET /api/v1/youtube/channels
Authorization: Bearer TU_ACCESS_TOKEN
```

**Respuesta:**

```json
{
  "channels": [
    {
      "id": "UC123456789",
      "title": "Mi Canal de YouTube",
      "subscriber_count": 1500,
      "connected_at": "2024-03-15T10:30:00Z"
    }
  ]
}
```

## 📤 Paso 4: Publicar en YouTube

### 4.1 Publicar Inmediatamente

```http
POST /api/v1/videos/vid_123/publish
Authorization: Bearer TU_ACCESS_TOKEN
Content-Type: application/json

{
  "channel_id": "UC123456789",
  "privacy": "public",
  "category_id": "22"
}
```

### 4.2 Programar Publicación

```http
POST /api/v1/videos/vid_123/publish
Authorization: Bearer TU_ACCESS_TOKEN
Content-Type: application/json

{
  "channel_id": "UC123456789",
  "privacy": "public",
  "publish_at": "2024-03-20T15:00:00Z",
  "category_id": "22"
}
```

**Respuesta:**

```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "status": "scheduled",
  "scheduled_for": "2024-03-20T15:00:00Z",
  "youtube_url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

## 💰 Paso 5: Gestionar Suscripción (Opcional)

### 5.1 Ver Planes Disponibles

```http
GET /api/v1/plans
```

### 5.2 Suscribirse a un Plan

```http
POST /api/v1/subscriptions/subscribe
Authorization: Bearer TU_ACCESS_TOKEN
Content-Type: application/json

{
  "plan_id": "plan_basic",
  "payment_method": "mercadopago"
}
```

Sigue la `payment_url` para completar el pago.

## ✅ Paso 6: Verificar Funcionamiento

### 6.1 Listar Tus Videos

```http
GET /api/v1/videos?page=1&limit=10
Authorization: Bearer TU_ACCESS_TOKEN
```

### 6.2 Ver Estado de Suscripción

```http
GET /api/v1/subscriptions/status
Authorization: Bearer TU_ACCESS_TOKEN
```

## 🎉 ¡Felicitaciones!

Has completado la configuración básica. Ahora puedes:

- ✅ Subir videos automáticamente
- ✅ Procesarlos con FFmpeg
- ✅ Publicarlos en YouTube
- ✅ Programar publicaciones futuras
- ✅ Gestionar tu suscripción

## 📞 Próximos Pasos

1. **Explora la API completa** en el [Manual de Usuario](../user-manual/USER_MANUAL.md)
2. **Configura automatizaciones** avanzadas
3. **Integra con tu aplicación** usando los SDKs disponibles
4. **Configura webhooks** para notificaciones en tiempo real

## 🆘 ¿Necesitas Ayuda?

- 📧 **Email**: soporte@video-programmer.com
- 💬 **Chat en vivo**: Disponible en el panel de usuario
- 📖 **Documentación**: [docs.video-programmer.com](https://docs.video-programmer.com)

---

_Guía actualizada - Octubre 2025_
