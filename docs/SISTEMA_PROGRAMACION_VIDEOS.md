# Sistema de Programación de Videos - Documentación Completa

## Resumen Ejecutivo

Sistema completo para la programación y subida de videos en plataformas como YouTube, implementado con Laravel + React/TypeScript. Permite gestión masiva de videos con interfaz drag-and-drop, validación inteligente, barra de progreso en tiempo real y programación automática.

## Características Implementadas

### 🎯 Funcionalidades Core

#### 1. **Gestión de Videos Individual**

- ✅ Subida de archivos con drag & drop
- ✅ Barra de progreso en tiempo real (XMLHttpRequest)
- ✅ Cancelación de subidas
- ✅ Validación de archivos (tipos: mp4, avi, mov, webm, mkv | tamaño: hasta 10GB)
- ✅ Auto-completado de títulos desde nombre de archivo
- ✅ Gestión de estados: pending → uploading → pending/completed

#### 2. **Subida Masiva (Bulk Upload)**

- ✅ Selección múltiple de archivos
- ✅ Auto-matching inteligente por nombre
- ✅ Detección de duplicados mejorada
- ✅ Prevención de conflictos en asignaciones
- ✅ Vista previa antes de confirmar

#### 3. **Validación y Estados**

- ✅ Validación progresiva (solo campos requeridos)
- ✅ Información obligatoria: **Video**, **Título**, **Fecha/Hora**
- ✅ Estados del video: `pending`, `uploading`, `scheduled`, `completed`, `failed`
- ✅ Feedback visual con badges de estado
- ✅ Mensajes de ayuda contextuales

#### 4. **Programación Inteligente**

- ✅ Botón "Programar" condicionado a información completa
- ✅ Fecha por defecto: mañana a las 00:00
- ✅ Validación de fechas futuras
- ✅ Selección múltiple con estadísticas

#### 5. **Integración con YouTube**

- ✅ Servicio de YouTube API (`YoutubeUploadService`)
- ✅ Jobs asíncronos para subida (`UploadVideoToYoutube`)
- ✅ Gestión de credenciales OAuth2
- ✅ Página de configuración para usuarios
- ✅ Sistema de simulación para desarrollo

## Arquitectura del Sistema

### 🏗️ Estructura Frontend (React/TypeScript)

```
resources/js/pages/dashboard/videoSchedules/
├── components/
│   ├── video-table/
│   │   ├── VideoTable.tsx           # Tabla principal editable
│   │   ├── FileUpload.tsx           # Componente de subida con progreso
│   │   └── BulkUploadModal.tsx      # Modal de subida masiva
│   ├── upload-actions/
│   │   └── UploadActions.tsx        # Controles de programación
│   ├── upload-logs/
│   │   └── UploadLogs.tsx           # Logs con alertas YouTube
│   └── VideoSchedulingWorkflow.tsx  # Orquestador principal
├── hooks/
│   ├── useVideoScheduling.ts        # Estado global del workflow
│   ├── useVideoUpload.ts            # Control de subidas
│   └── useFileUpload.ts             # Subida individual con progreso
└── types/
    └── index.ts                     # Tipos TypeScript
```

### 🔧 Estructura Backend (Laravel)

```
app/
├── Http/Controllers/
│   └── VideoUploadController.php    # API endpoints para subida
├── Services/
│   └── YoutubeUploadService.php     # Integración YouTube API
├── Jobs/
│   └── UploadVideoToYoutube.php     # Procesamiento asíncrono
└── Models/
    ├── Video.php                    # Modelo principal
    ├── VideoSchedule.php            # Programación
    └── YoutubeCredential.php        # Credenciales OAuth
```

## Flujos de Usuario Implementados

### 📤 Flujo de Subida Individual

1. **Selección**: Usuario hace clic o arrastra archivo
2. **Validación**: Verificación de tipo y tamaño
3. **Subida**: Barra de progreso en tiempo real
4. **Completado**: Auto-título + estado 'pending'
5. **Validación**: Verificación de información obligatoria
6. **Programación**: Habilitación del botón según completitud

### 📦 Flujo de Subida Masiva

1. **Selección**: Múltiples archivos de video
2. **Matching**: Auto-asignación por nombre
3. **Resolución**: Gestión de duplicados y conflictos
4. **Asignación**: Videos nuevos vs existentes
5. **Confirmación**: Vista previa antes de aplicar
6. **Procesamiento**: Aplicación de cambios en lote

### ⏰ Flujo de Programación

1. **Validación**: Verificación de información obligatoria
2. **Selección**: Múltiple con vista de estadísticas
3. **Configuración**: Tipo de acción (subir/programar)
4. **Confirmación**: Dialog con resumen
5. **Ejecución**: Procesamiento con progreso
6. **Monitoreo**: Logs en tiempo real

## Validaciones Implementadas

### 📋 Campos Obligatorios

| Campo          | Validación       | Comportamiento                |
| -------------- | ---------------- | ----------------------------- |
| **Video**      | Archivo presente | Auto-validado en subida       |
| **Título**     | Mín. 1 carácter  | Auto-completado desde archivo |
| **Fecha/Hora** | Fecha futura     | Default: mañana 00:00         |

### 🔒 Validaciones de Archivo

| Aspecto    | Regla                          | Mensaje de Error                   |
| ---------- | ------------------------------ | ---------------------------------- |
| **Tipo**   | video/\* (mp4, avi, mov, etc.) | "Tipo de archivo no válido"        |
| **Tamaño** | Máximo 10GB                    | "Archivo excede tamaño máximo"     |
| **Estado** | No duplicados activos          | "Archivo ya está siendo procesado" |

### ✅ Estados de Validación

- **Sin validar**: Videos recién creados sin archivos
- **Progresiva**: Solo valida campos cuando tienen contenido
- **Completa**: Antes de programar, verifica información obligatoria
- **Contextual**: Mensajes específicos según el estado del video

## APIs y Endpoints

### 🔌 Endpoints Implementados

```php
// Subida individual con progreso
POST /video-uploads/single-file
Content-Type: multipart/form-data
Body: { video_file: File }

// Subida masiva
POST /video-uploads/bulk
Body: {
    channel_id: number,
    videos: Array<{
        title: string,
        video_file: File,
        scheduled_at: datetime,
        ...
    }>
}

// Configuración YouTube
GET /dashboard/youtube-setup
```

### 📡 Respuestas API

```typescript
// Subida exitosa
{
    success: true,
    message: "Archivo subido exitosamente",
    data: {
        file_path: string,
        file_name: string,
        file_size: number,
        mime_type: string
    }
}

// Error de validación
{
    success: false,
    message: "Error durante la subida",
    errors: {
        video_file: ["El archivo excede el tamaño máximo"]
    }
}
```

## Integración con YouTube

### 🔑 Configuración OAuth2

```php
// YoutubeUploadService.php
class YoutubeUploadService {
    public function uploadVideo($video, $channelId): array
    public function setupAuthentication($credentials): bool
    public function refreshToken($refreshToken): array
}
```

### 🚀 Job Asíncrono

```php
// UploadVideoToYoutube.php
class UploadVideoToYoutube implements ShouldQueue {
    public function handle(): void
    public function failed(Throwable $exception): void
}
```

### 📊 Estados de YouTube

- **Sin credenciales**: Simulación local
- **Con credenciales**: Subida real a YouTube
- **Error de API**: Retry automático con backoff
- **Cuotas excedidas**: Programación diferida

## Componentes UI Destacados

### 🎨 FileUpload con Progreso

```tsx
// Características implementadas
- Drag & drop nativo
- Barra de progreso XMLHttpRequest
- Cancelación en tiempo real
- Estados visuales (loading, success, error)
- Validación previa de archivos
- Diseño responsive (compact/normal)
```

### 📊 UploadActions Inteligente

```tsx
// Validación condicional
const canStartUpload = selectedVideos.size > 0 && selectedVideosComplete;

// Feedback contextual
{
  !selectedVideosComplete && (
    <Alert>
      Para programar videos, todos deben tener: Video, Título y Fecha/Hora
      completados.
    </Alert>
  );
}
```

### 📈 Sistema de Estados

```typescript
type VideoStatus =
  | "pending" // Listo para programar
  | "uploading" // Subiendo archivo
  | "scheduled" // Programado en cola
  | "completed" // Subido exitosamente
  | "failed"; // Error en proceso
```

## Problemas Resueltos

### 🐛 Issues Corregidos

1. **Validación falsa positiva**: Videos con archivos marcados como "requeridos"
2. **Duplicados en bulk upload**: Lógica mejorada de matching
3. **Fechas incorrectas**: Default a mañana 00:00
4. **Estados inconsistentes**: Flujo de estados corregido
5. **Títulos vacíos**: Auto-completado desde nombre de archivo
6. **Botón programar siempre activo**: Validación condicional implementada

### ⚡ Optimizaciones

- **Performance**: useMemo/useCallback en componentes críticos
- **UX**: Feedback visual inmediato en todas las acciones
- **Validación**: Progresiva en lugar de blocking
- **Estados**: Gestión centralizada con hooks
- **Errores**: Manejo robusto con recovery automático

## Testing y Desarrollo

### 🧪 Simulación YouTube

```php
// Modo desarrollo sin credenciales reales
if (!$hasValidCredentials) {
    return $this->simulateUpload($video);
}
```

### 🔍 Debugging

- Logs detallados en `storage/logs/laravel.log`
- Estados de video tracked en tiempo real
- Progress tracking en consola del navegador
- Error boundaries para fallos de componentes

## Deployment y Configuración

### ⚙️ Variables de Entorno

```env
# YouTube API
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:8000/auth/youtube/callback

# Storage
FILESYSTEM_DISK=public
MAX_UPLOAD_SIZE=10240000  # 10GB en KB
```

### 📁 Storage Setup

```bash
# Crear enlaces simbólicos
php artisan storage:link

# Permisos para uploads
chmod -R 755 storage/app/public/videos/
```

## Roadmap Futuro

### 🔮 Próximas Funcionalidades

- [ ] **Programación recurrente** (semanal, mensual)
- [ ] **Templates de contenido** para descripción/tags
- [ ] **Análisis de rendimiento** post-upload
- [ ] **Integración con más plataformas** (TikTok, Instagram)
- [ ] **Sistema de thumbnails** automático
- [ ] **AI para optimización** de títulos/descripciones

### 🎯 Mejoras Técnicas

- [ ] **WebSocket** para progress real-time
- [ ] **Chunked upload** para archivos muy grandes
- [ ] **Background sync** para uploads offline
- [ ] **CDN integration** para serving de videos
- [ ] **Microservices** para scaling horizontal

---

## 👨‍💻 Para Desarrolladores

### 🚀 Arranque Rápido

```bash
# Clonar y setup
git clone [repo]
cd Video-programmer/main-laravel
composer install && npm install

# Configurar DB y storage
php artisan migrate
php artisan storage:link

# Desarrollo
npm run dev
php artisan serve
```

### 🔧 Comandos Útiles

```bash
# Limpiar uploads fallidos
php artisan queue:clear

# Ver jobs en cola
php artisan queue:monitor

# Debug de YouTube API
php artisan tinker
>>> app(YoutubeUploadService::class)->checkCredentials();
```

---

_Documentación generada el 5 de Noviembre de 2025_
_Sistema de Programación de Videos v1.0.0_
