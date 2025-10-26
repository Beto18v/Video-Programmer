# Estructura de Base de Datos - Sistema SaaS de Programación de Videos YouTube

## Resumen del Sistema

Sistema SaaS que permite a los usuarios programar videos de YouTube de manera masiva y gestionar varios canales. Implementa un sistema de suscripciones con planes Free, Pro y Premium, utilizando Mercado Pago para pagos.

## Planes de Suscripción

- **Free**: 5 videos/mes, $0 USD
- **Pro**: 100 videos/mes, $9.90 USD
- **Premium**: Videos ilimitados, $19.90 USD

## Estructura de Tablas

### 1. Tabla `users` (Extendida)

**Propósito**: Información de usuarios del sistema.

**Nuevos campos agregados**:

```sql
first_name VARCHAR(255) NULL
last_name VARCHAR(255) NULL
avatar_url VARCHAR(255) NULL
timezone VARCHAR(50) DEFAULT 'UTC'
locale VARCHAR(10) DEFAULT 'en'
is_active BOOLEAN DEFAULT true
last_login_at TIMESTAMP NULL
preferences JSON NULL
```

**Índices**:

- `is_active`
- `last_login_at`

**Relaciones**:

- `hasMany(Channel::class)` - Canales del usuario
- `hasMany(Video::class)` - Videos del usuario
- `hasMany(Subscription::class)` - Suscripciones del usuario
- `hasOne(Subscription::class)->active()` - Suscripción activa
- `hasMany(ActivityLog::class)` - Logs de actividad

### 2. Tabla `plans`

**Propósito**: Planes de suscripción disponibles.

**Campos**:

```sql
id BIGINT PRIMARY KEY
name VARCHAR(50) UNIQUE -- 'free', 'pro', 'premium'
display_name VARCHAR(100) -- Nombre para mostrar
description TEXT NULL
price DECIMAL(10,2) DEFAULT 0 -- Precio mensual
video_limit INT NULL -- NULL = ilimitado
is_active BOOLEAN DEFAULT true
sort_order INT DEFAULT 0
features JSON NULL -- Lista de características
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `is_active`
- `sort_order`

**Relaciones**:

- `hasMany(Subscription::class)` - Suscripciones del plan

### 3. Tabla `channels`

**Propósito**: Canales de YouTube conectados por usuarios.

**Campos**:

```sql
id BIGINT PRIMARY KEY
user_id BIGINT FOREIGN KEY
youtube_channel_id VARCHAR(255) UNIQUE -- ID en YouTube
name VARCHAR(255) -- Nombre del canal
custom_url VARCHAR(255) NULL -- URL personalizada
description TEXT NULL
avatar_url VARCHAR(255) NULL
banner_url VARCHAR(255) NULL
subscriber_count BIGINT DEFAULT 0
video_count BIGINT DEFAULT 0
view_count BIGINT DEFAULT 0
status ENUM('active', 'inactive', 'suspended', 'error') DEFAULT 'active'
connected_at TIMESTAMP
last_sync_at TIMESTAMP NULL
channel_metadata JSON NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `user_id`
- `status`
- `connected_at`
- `user_id, status` (compuesto)

**Relaciones**:

- `belongsTo(User::class)` - Usuario propietario
- `hasOne(YoutubeCredential::class)` - Credenciales OAuth
- `hasMany(Video::class)` - Videos del canal

### 4. Tabla `youtube_credentials`

**Propósito**: Tokens OAuth encriptados para acceso a YouTube API.

**Campos**:

```sql
id BIGINT PRIMARY KEY
channel_id BIGINT FOREIGN KEY
access_token TEXT -- Encriptado
refresh_token TEXT -- Encriptado
expires_at TIMESTAMP
scopes JSON -- Permisos otorgados
status ENUM('active', 'expired', 'revoked', 'invalid') DEFAULT 'active'
last_refreshed_at TIMESTAMP NULL
refresh_count INT DEFAULT 0
token_metadata JSON NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `channel_id`
- `status`
- `expires_at`
- `channel_id, status` (compuesto)

**Relaciones**:

- `belongsTo(Channel::class)` - Canal asociado

**Seguridad**:

- Tokens encriptados usando Laravel Crypt
- Atributos ocultos por defecto

### 5. Tabla `videos`

**Propósito**: Videos para programar/subir a YouTube.

**Campos**:

```sql
id BIGINT PRIMARY KEY
user_id BIGINT FOREIGN KEY
channel_id BIGINT FOREIGN KEY
title VARCHAR(255)
description TEXT NULL
file_path VARCHAR(255) NULL -- Ruta del archivo
thumbnail_path VARCHAR(255) NULL
thumbnail_url VARCHAR(255) NULL
status ENUM('draft', 'pending', 'uploading', 'uploaded', 'published', 'failed', 'deleted') DEFAULT 'draft'
youtube_video_id VARCHAR(255) UNIQUE NULL
privacy ENUM('private', 'unlisted', 'public') DEFAULT 'private'
tags JSON NULL
category_id VARCHAR(10) NULL -- ID categoría YouTube
language VARCHAR(10) DEFAULT 'en'
made_for_kids BOOLEAN DEFAULT false
scheduled_for TIMESTAMP NULL
published_at TIMESTAMP NULL
upload_error TEXT NULL
video_metadata JSON NULL
file_size BIGINT NULL -- Bytes
duration VARCHAR(255) NULL -- HH:MM:SS
view_count BIGINT DEFAULT 0
like_count BIGINT DEFAULT 0
comment_count BIGINT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `user_id`
- `channel_id`
- `status`
- `scheduled_for`
- `published_at`
- `user_id, status` (compuesto)
- `channel_id, status` (compuesto)
- `scheduled_for, status` (compuesto)

**Relaciones**:

- `belongsTo(User::class)` - Usuario propietario
- `belongsTo(Channel::class)` - Canal destino
- `hasMany(VideoSchedule::class)` - Programaciones

### 6. Tabla `video_schedules`

**Propósito**: Programación masiva y automática de videos.

**Campos**:

```sql
id BIGINT PRIMARY KEY
video_id BIGINT FOREIGN KEY
scheduled_at TIMESTAMP -- Fecha programada
status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending'
action ENUM('upload', 'publish', 'update_privacy') DEFAULT 'upload'
action_parameters JSON NULL
executed_at TIMESTAMP NULL
error_message TEXT NULL
execution_log JSON NULL
retry_count INT DEFAULT 0
max_retries INT DEFAULT 3
next_retry_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `video_id`
- `scheduled_at`
- `status`
- `next_retry_at`
- `status, scheduled_at` (compuesto)
- `status, next_retry_at` (compuesto)

**Relaciones**:

- `belongsTo(Video::class)` - Video asociado

### 7. Tabla `subscriptions`

**Propósito**: Suscripciones de usuarios con integración a Mercado Pago.

**Campos**:

```sql
id BIGINT PRIMARY KEY
user_id BIGINT FOREIGN KEY
plan_id BIGINT FOREIGN KEY
status ENUM('active', 'cancelled', 'expired', 'suspended', 'pending_payment') DEFAULT 'active'
starts_at TIMESTAMP
ends_at TIMESTAMP
cancelled_at TIMESTAMP NULL
payment_method ENUM('mercado_pago', 'free') DEFAULT 'free'
mercado_pago_subscription_id VARCHAR(255) UNIQUE NULL
mercado_pago_payment_id VARCHAR(255) NULL
amount DECIMAL(10,2) DEFAULT 0
currency VARCHAR(3) DEFAULT 'USD'
payment_metadata JSON NULL
last_payment_at TIMESTAMP NULL
next_billing_at TIMESTAMP NULL
videos_used_this_month INT DEFAULT 0
usage_reset_at TIMESTAMP NULL
auto_renew BOOLEAN DEFAULT true
cancellation_reason TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `user_id`
- `plan_id`
- `status`
- `ends_at`
- `next_billing_at`
- `user_id, status` (compuesto)
- `status, ends_at` (compuesto)
- `status, next_billing_at` (compuesto)

**Relaciones**:

- `belongsTo(User::class)` - Usuario suscrito
- `belongsTo(Plan::class)` - Plan contratado

**Funcionalidades**:

- Control de límites mensuales de videos
- Renovación automática
- Integración con Mercado Pago
- Reset automático de contadores

### 8. Tabla `activity_logs`

**Propósito**: Auditoría de acciones importantes del sistema.

**Campos**:

```sql
id BIGINT PRIMARY KEY
user_id BIGINT FOREIGN KEY NULL
action VARCHAR(255) -- Tipo de acción
entity_type VARCHAR(255) NULL -- Clase del modelo
entity_id BIGINT NULL -- ID de la entidad
description TEXT -- Descripción legible
metadata JSON NULL -- Datos adicionales
changes JSON NULL -- Cambios before/after
ip_address VARCHAR(45) NULL
user_agent TEXT NULL
level ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info'
performed_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Índices**:

- `user_id`
- `action`
- `entity_type`
- `entity_type, entity_id` (compuesto)
- `performed_at`
- `level`
- `user_id, action` (compuesto)
- `user_id, performed_at` (compuesto)

**Relaciones**:

- `belongsTo(User::class)` - Usuario que realizó la acción
- `morphTo()` - Entidad polimórfica

## Casos de Uso Principales

### 1. Gestión de Límites de Videos

```php
// Verificar si puede subir videos
if ($user->canUseVideos(5)) {
    // Procesar subida
    $user->incrementVideoUsage(5);
}

// Obtener videos restantes
$remaining = $user->remaining_videos;
```

### 2. Programación de Videos

```php
// Crear programación
VideoSchedule::create([
    'video_id' => $video->id,
    'scheduled_at' => $scheduledDate,
    'action' => 'upload',
]);

// Ejecutar programaciones pendientes
$schedules = VideoSchedule::readyToExecute()->get();
```

### 3. Logs de Actividad

```php
// Log automático de eventos
ActivityLog::channelConnected($channel, $user);
ActivityLog::videoUploaded($video, $user);
ActivityLog::planChanged($subscription, $oldPlan, $user);
```

### 4. Gestión de Suscripciones

```php
// Verificar suscripción activa
if ($user->hasActiveSubscription()) {
    $plan = $user->getCurrentPlan();
}

// Renovar suscripción
$subscription->renew();

// Cancelar suscripción
$subscription->cancel('Usuario solicitó cancelación');
```

## Migraciones Creadas

1. `2025_10_23_195001_add_additional_fields_to_users_table.php`
2. `2025_10_23_195034_create_plans_table.php`
3. `2025_10_23_195208_create_channels_table.php`
4. `2025_10_23_195315_create_youtube_credentials_table.php`
5. `2025_10_23_195419_create_videos_table.php`
6. `2025_10_23_195508_create_video_schedules_table.php`
7. `2025_10_23_195547_create_subscriptions_table.php`
8. `2025_10_23_195636_create_activity_logs_table.php`

## Seeders

- `PlansSeeder.php` - Crear los tres planes básicos (Free, Pro, Premium)

## Comandos para Ejecutar

```bash
# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders
php artisan db:seed --class=PlansSeeder

# Ejecutar todo
php artisan migrate --seed
```

## Consideraciones de Seguridad

1. **Tokens OAuth**: Encriptados usando Laravel Crypt
2. **Logs de Actividad**: Auditoría completa de acciones críticas
3. **Validación de Límites**: Control estricto de uso mensual
4. **Índices**: Optimización para consultas frecuentes
5. **Integridad Referencial**: Foreign keys con cascadas apropiadas

## Escalabilidad

1. **Índices Compuestos**: Para consultas complejas frecuentes
2. **JSON Fields**: Para metadatos flexibles
3. **Soft Deletes**: Consideración futura para videos
4. **Particionado**: Posible para activity_logs por fecha
5. **Cache**: Redis para límites de videos en tiempo real

## Próximos Pasos

1. Implementar Jobs para procesamiento asíncrono de videos
2. Crear middleware para verificación de límites
3. Implementar webhooks de Mercado Pago
4. Crear dashboard de analytics
5. Implementar sistema de notificaciones
