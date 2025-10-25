# Sistema de Programación de Videos

## Descripción General

Este sistema permite programar y subir videos de manera eficiente a canales de YouTube conectados. La funcionalidad incluye una interfaz tipo spreadsheet para gestión manual de videos, integración con Google Sheets, y herramientas para subida masiva y programación.

## Estructura de Archivos

```
resources/js/pages/dashboard/videoSchedules/
├── components/
│   ├── channel-selection/
│   │   ├── ChannelSelection.tsx       # Lista de canales conectados
│   │   └── index.ts
│   ├── video-table/
│   │   ├── VideoTable.tsx             # Tabla editable de videos
│   │   ├── FileUpload.tsx             # Componente para carga de archivos
│   │   └── index.ts
│   ├── sheet-mapping/
│   │   ├── SheetMappingModal.tsx      # Modal para mapear Google Sheets
│   │   └── index.ts
│   ├── upload-actions/
│   │   ├── UploadActions.tsx          # Acciones masivas de subida
│   │   └── index.ts
│   ├── VideoSchedulingWorkflow.tsx    # Componente principal integrador
│   └── index.ts
├── hooks/
│   ├── useVideoScheduling.ts          # Hook personalizado para gestión de estado
│   └── index.ts
├── types/
│   └── index.ts                       # Tipos TypeScript
├── index.tsx                          # Página principal con tabs
├── create.tsx                         # Formulario individual (existente)
├── edit.tsx                          # Edición individual (existente)
└── show.tsx                          # Vista individual (existente)
```

## Componentes Principales

### 1. ChannelSelection

- **Propósito**: Muestra lista de canales conectados para selección
- **Características**:
    - Cards con información del canal (avatar, nombre, estadísticas)
    - Botón de selección por canal
    - Validación de estado del canal (activo/inactivo)
    - Enlace para conectar nuevos canales si no hay disponibles

### 2. VideoTable

- **Propósito**: Tabla editable tipo spreadsheet para gestión de videos
- **Características**:
    - Columnas editables: Video, Título, Descripción, Hashtags, Miniatura, Fecha/Hora
    - Celdas editables con click (tipo Excel/Google Sheets)
    - Componente de carga de archivos integrado
    - Botón para conectar con Google Sheets
    - Funciones para agregar/eliminar filas

### 3. SheetMappingModal

- **Propósito**: Modal para conectar y mapear campos con Google Sheets
- **Características**:
    - Input para URL del Google Sheet
    - Vista previa de datos del Sheet
    - Sistema de mapeo drag-and-drop de campos
    - Lista de campos requeridos con validación
    - Importación automática de datos mapeados

### 4. UploadActions

- **Propósito**: Gestión de subidas y programación masiva
- **Características**:
    - Estadísticas de videos (total, completados, fallidos, etc.)
    - Selección múltiple de videos
    - Barra de progreso en tiempo real
    - Controles de pausa/reanudar/cancelar
    - Opciones de subida inmediata vs programada

### 5. VideoSchedulingWorkflow

- **Propósito**: Componente principal que integra todo el flujo
- **Características**:
    - Flujo paso a paso (Seleccionar Canal → Gestionar Videos → Subir/Programar)
    - Gestión de estado centralizada
    - Comunicación entre componentes
    - Interfaz limpia y guiada

## Hook Personalizado

### useVideoScheduling

- **Propósito**: Manejo centralizado del estado de la aplicación
- **Funcionalidades**:
    - Gestión de canal seleccionado
    - CRUD de videos
    - Control de subidas (iniciar, pausar, reanudar, cancelar)
    - Progreso de subidas en tiempo real
    - Importación desde Google Sheets
    - Simulación de API calls con progreso

## Tipos TypeScript

### Principales Interfaces

```typescript
interface Channel {
    id: number;
    name: string;
    description: string;
    status: string;
    subscriber_count: number;
    video_count: number;
    view_count: number;
    avatar_url: string | null;
    platform: string;
}

interface VideoUpload {
    id: string;
    file?: File;
    fileName?: string;
    title: string;
    description: string;
    hashtags: string;
    thumbnail?: File;
    thumbnailUrl?: string;
    scheduledAt: string;
    status: 'pending' | 'uploading' | 'scheduled' | 'completed' | 'failed';
    progress?: number;
    error?: string;
}
```

## Flujo de Usuario

### 1. Pantalla Principal

- El usuario ve dos tabs: "Programar Videos" e "Historial"
- Por defecto se abre en "Programar Videos"

### 2. Selección de Canal

- Lista de canales conectados en formato de cards
- Click en "Seleccionar" para elegir un canal
- Si no hay canales, se muestra botón para conectar

### 3. Gestión de Videos

- Tabla editable aparece después de seleccionar canal
- Click en celdas para editar (título, descripción, hashtags)
- Upload de archivos de video y miniatura
- Botón "Conectar con Sheet" para importación masiva

### 4. Conectar con Google Sheets (Opcional)

- Modal con input de URL del Sheet
- Vista previa de columnas del Sheet
- Mapeo visual de campos requeridos a columnas
- Importación automática de datos

### 5. Subida y Programación

- Selección de videos individuales o masiva
- Elección entre "Subir Ahora" o "Programar"
- Progreso en tiempo real con controles de pausa/reanudar
- Estadísticas y estado de cada video

## Características Técnicas

### Componentes UI Creados

- `Textarea`: Campo de texto multilinea
- `ScrollArea`: Área de scroll personalizada
- `Progress`: Barra de progreso
- `Tabs`: Sistema de pestañas

### Gestión de Estado

- Hook personalizado con useCallback para optimización
- Estado local con useState para componentes
- Refs para control de procesos asíncronos (AbortController)

### Validaciones

- Tipos de archivo (video/_, image/_)
- Tamaño máximo de archivos (2GB videos, 10MB imágenes)
- URLs válidas de Google Sheets
- Campos requeridos antes de subida

### Simulación de APIs

- Proceso de subida con progreso incremental
- Manejo de errores y estados
- Integración con Google Sheets (mock data)

## Integración con Backend

### Endpoints Requeridos (Sugeridos)

```php
// Obtener canales del usuario
GET /api/channels

// Subir video
POST /api/videos/upload
{
  "channel_id": 1,
  "video": File,
  "title": "string",
  "description": "string",
  "hashtags": "string",
  "thumbnail": File,
  "scheduled_at": "datetime"
}

// Programar video
POST /api/videos/schedule
{
  "channel_id": 1,
  "videos": [...]
}

// Conectar Google Sheet
POST /api/sheets/connect
{
  "sheet_url": "string"
}

// Obtener datos del Sheet
GET /api/sheets/data?url=...
```

## Instalación y Uso

### 1. Dependencias

El sistema utiliza los componentes UI ya existentes en el proyecto. Los nuevos componentes creados están en:

- `/components/ui/textarea.tsx`
- `/components/ui/scroll-area.tsx`
- `/components/ui/progress.tsx`
- `/components/ui/tabs.tsx`

### 2. Uso de la Página

```tsx
// En tu controlador Laravel, pasar los canales
public function index()
{
    $channels = Auth::user()->channels()->where('status', 'active')->get();

    return Inertia::render('Dashboard/VideoSchedules/Index', [
        'channels' => $channels->map(function ($channel) {
            return [
                'id' => $channel->id,
                'name' => $channel->name,
                'description' => $channel->description,
                'status' => $channel->status,
                'subscriber_count' => $channel->subscriber_count,
                'video_count' => $channel->video_count,
                'view_count' => $channel->view_count,
                'avatar_url' => $channel->avatar_url,
                'platform' => $channel->platform,
            ];
        }),
    ]);
}
```

### 3. Rutas Sugeridas

```php
// En web.php o routes específicas
Route::middleware(['auth'])->prefix('video-schedules')->group(function () {
    Route::get('/', [VideoScheduleController::class, 'index']);
    Route::post('/upload', [VideoScheduleController::class, 'upload']);
    Route::post('/schedule', [VideoScheduleController::class, 'schedule']);
    Route::post('/sheets/connect', [VideoScheduleController::class, 'connectSheet']);
});
```

## Ventajas del Sistema

1. **Interfaz Intuitiva**: Flujo paso a paso que guía al usuario
2. **Flexibilidad**: Entrada manual o importación masiva desde Sheets
3. **Control Total**: Gestión granular de subidas con controles de pausa/reanudar
4. **Escalable**: Arquitectura modular que permite agregar nuevas funcionalidades
5. **Tipado Fuerte**: TypeScript para mejor mantenimiento y desarrollo
6. **Responsive**: Diseño adaptable a diferentes tamaños de pantalla
7. **Gestión de Errores**: Manejo robusto de errores con feedback al usuario

## Próximas Mejoras

1. **Integración Real con Google Sheets API**
2. **Subidas en Paralelo**: Múltiples videos simultáneos
3. **Plantillas de Videos**: Guardar configuraciones comunes
4. **Programación Avanzada**: Calendarios, series, etc.
5. **Analytics**: Estadísticas de rendimiento de subidas
6. **Notificaciones**: Alerts cuando se completen subidas
7. **Backup/Restore**: Guardar borradores de programaciones
