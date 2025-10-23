# 🔧 Solución de Problemas - Video Programmer

## 🚨 Problemas Comunes y Soluciones

### Error 401: No autorizado

**Síntomas:**

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Token inválido o expirado"
  }
}
```

**Soluciones:**

1. ✅ **Renovar token:**

   ```http
   POST /api/v1/auth/refresh
   Authorization: Bearer tu_token_actual
   ```

2. ✅ **Hacer login nuevamente:**

   ```http
   POST /api/v1/auth/login
   Content-Type: application/json

   {
     "email": "tu-email@ejemplo.com",
     "password": "tu_contraseña"
   }
   ```

3. ✅ **Verificar expiración:** Los tokens expiran en 30 minutos

---

### Error 403: Acceso denegado

**Síntomas:**

```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "No tienes permisos para realizar esta acción"
  }
}
```

**Soluciones:**

1. ✅ **Verificar rol de usuario:** Solo administradores pueden acceder a ciertos endpoints
2. ✅ **Contactar soporte:** Si necesitas permisos adicionales
3. ✅ **Verificar token:** Asegurarse de usar el token correcto

---

### Error 413: Archivo demasiado grande

**Síntomas:**

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "El archivo excede el tamaño máximo permitido"
  }
}
```

**Soluciones:**

1. ✅ **Comprimir video:** Usar herramientas como HandBrake o Adobe Media Encoder
2. ✅ **Reducir resolución:** Convertir a 1080p o menos
3. ✅ **Acortar duración:** Si es posible, dividir en videos más cortos
4. ✅ **Verificar límites del plan:** Actualizar plan si es necesario

**Límites por plan:**

- Básico: 500MB
- Profesional: 2GB
- Enterprise: 5GB

---

### Error 422: Límite de videos alcanzado

**Síntomas:**

```json
{
  "error": {
    "code": "BUSINESS_LOGIC_ERROR",
    "message": "Has alcanzado el límite de videos para tu plan actual"
  }
}
```

**Soluciones:**

1. ✅ **Verificar uso actual:**

   ```http
   GET /api/v1/subscriptions/status
   Authorization: Bearer tu_token
   ```

2. ✅ **Esperar al siguiente ciclo:** Los límites se resetean mensualmente
3. ✅ **Actualizar plan:** Cambiar a un plan superior
4. ✅ **Eliminar videos antiguos:** Liberar espacio en tu cuenta

---

### Error 429: Demasiadas solicitudes

**Síntomas:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Demasiadas solicitudes. Intenta de nuevo más tarde."
  }
}
```

**Soluciones:**

1. ✅ **Esperar el tiempo indicado** en el header `Retry-After`
2. ✅ **Implementar backoff exponencial** en tu código
3. ✅ **Optimizar frecuencia de requests**
4. ✅ **Usar webhooks** para notificaciones en lugar de polling

**Límites de rate limiting:**

- General: 1000 requests/hora por IP
- Autenticado: 5000 requests/hora por usuario
- Upload: 10 videos/hora por usuario

---

### Problemas de Procesamiento de Video

**Síntomas:**

- Video queda en estado "processing" por mucho tiempo
- Procesamiento falla con error

**Soluciones:**

1. ✅ **Verificar formato soportado:**

   - MP4, AVI, MOV, MKV, FLV, WMV
   - Códecs: H.264, H.265, VP9

2. ✅ **Corregir archivo corrupto:**

   ```bash
   # Verificar integridad con FFmpeg
   ffmpeg -v error -i video.mp4 -f null -
   ```

3. ✅ **Reintentar subida:** Si el archivo está corrupto, subir una versión corregida

---

### Problemas de Conexión con YouTube

**Síntomas:**

- Error al conectar canal de YouTube
- Fallo en publicación automática

**Soluciones:**

1. ✅ **Verificar OAuth2:**

   - Asegurar que la app de Google esté configurada
   - Verificar redirect URIs

2. ✅ **Renovar autorización:**

   ```http
   GET /api/v1/youtube/auth
   Authorization: Bearer tu_token
   ```

3. ✅ **Verificar permisos del canal:**
   - El canal debe permitir uploads vía API
   - Verificar que no esté restringido

---

### Problemas de Pago

**Síntomas:**

- Fallo en procesamiento de pago
- Suscripción no se activa

**Soluciones:**

1. ✅ **Verificar método de pago:** Tarjeta válida y con fondos
2. ✅ **Contactar soporte de MercadoPago/Stripe**
3. ✅ **Reintentar transacción**
4. ✅ **Verificar configuración regional**

---

## 🔍 Diagnóstico Avanzado

### Ver Logs de la Aplicación

```http
GET /api/v1/logs/application?level=ERROR&since=2024-03-15
Authorization: Bearer tu_token
```

### Ver Estado del Sistema

```http
GET /api/v1/health
```

**Respuesta esperada:**

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "ffmpeg": "available",
  "youtube_api": "connected"
}
```

### Ver Uso de Recursos

```http
GET /api/v1/usage/stats
Authorization: Bearer tu_token
```

---

## 🆘 Contactar Soporte

### Información a Proporcionar

Cuando contactes soporte, incluye:

1. **Request ID:** Disponible en headers de respuesta (`X-Request-ID`)
2. **Timestamp:** Cuándo ocurrió el problema
3. **Endpoint:** Qué endpoint estabas usando
4. **Payload:** Datos enviados (sin información sensible)
5. **Respuesta completa:** Error message y código
6. **User Agent:** Información de tu aplicación/cliente

### Canales de Soporte

- **🚨 Urgente:** Chat en vivo (24/7)
- **📧 General:** soporte@video-programmer.com
- **📋 Bugs:** [GitHub Issues](https://github.com/Beto18v/Video-Programmer/issues)
- **📖 Documentación:** [docs.video-programmer.com](https://docs.video-programmer.com)

### Tiempos de Respuesta

- **Crítico:** < 1 hora
- **Alto:** < 4 horas
- **Normal:** < 24 horas
- **Bajo:** < 48 horas

---

## 🚀 Prevención de Problemas

### Mejores Prácticas

1. **✅ Validar archivos antes de subir:**

   ```bash
   # Verificar video con FFmpeg
   ffmpeg -i video.mp4 -f null - 2>error.log
   ```

2. **✅ Implementar manejo de errores:**

   ```javascript
   async function uploadVideo(file) {
     try {
       const response = await fetch("/api/v1/videos/upload", {
         method: "POST",
         headers: { Authorization: `Bearer ${token}` },
         body: formData,
       });

       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }

       return await response.json();
     } catch (error) {
       console.error("Upload failed:", error);
       // Implementar reintento con backoff
     }
   }
   ```

3. **✅ Monitorear límites de uso:**

   ```http
   GET /api/v1/subscriptions/status
   Authorization: Bearer tu_token
   ```

4. **✅ Mantener tokens actualizados:**
   - Renovar tokens antes de que expiren
   - Implementar refresh automático

---

_Guía de troubleshooting - Octubre 2025_
