# Sistema de Sincronización en Tiempo Real para Canales de YouTube

Este sistema permite actualizar la información de los canales de YouTube en tiempo real, manteniendo sincronizados los datos como número de suscriptores, videos y visualizaciones.

## Características Implementadas

### 1. Sincronización Manual desde la Interfaz

- **Botón de sincronización individual**: Cada canal tiene un botón de actualización que permite sincronizar sus estadísticas al instante
- **Botón de sincronización masiva**: Un botón "Sincronizar Todo" que actualiza todos los canales activos
- **Indicadores de carga**: Los botones muestran un spinner durante la sincronización
- **Retroalimentación visual**: Toast notifications informan del éxito o error de la operación
- **Actualización en tiempo real**: Los datos se actualizan en la interfaz sin necesidad de recargar la página

### 2. Sincronización Automática

- **Programación automática**: Los canales se sincronizan automáticamente cada 15 minutos
- **Sincronización de videos**: Las estadísticas de videos se actualizan cada hora
- **Procesamiento en segundo plano**: Utiliza el sistema de colas de Laravel para no bloquear la interfaz

### 3. API Endpoints

- `POST /channels/{channel}/sync` - Sincroniza un canal específico
- `POST /channels/sync-all` - Sincroniza todos los canales del usuario autenticado

### 4. Comandos de Artisan

```bash
# Sincronizar estadísticas de un canal específico
php artisan channels:sync-stats {channelId}

# Sincronizar estadísticas de todos los canales activos
php artisan channels:sync-stats

# Sincronizar estadísticas de videos
php artisan videos:sync-stats
```

## Cómo Funciona

### Sincronización de Canales (`SyncChannelStats`)

1. **Obtención de credenciales**: Busca las credenciales OAuth del canal
2. **Renovación de tokens**: Actualiza automáticamente los tokens expirados
3. **Consulta a YouTube API**: Obtiene estadísticas actuales del canal
4. **Actualización de datos**: Guarda la información en la base de datos
5. **Registro de actividad**: Actualiza `last_sync_at` para rastrear la última sincronización

### Datos Sincronizados

- **Información básica**: Nombre y descripción del canal
- **Estadísticas**: Número de suscriptores, videos y visualizaciones totales
- **Metadatos**: Avatar del canal y fecha de última sincronización

## Configuración del Scheduler

El sistema utiliza el Laravel Scheduler configurado en `bootstrap/app.php`:

```php
->withSchedule(function ($schedule) {
    $schedule->job(new SyncVideoStats)->hourly();
    $schedule->job(new SyncChannelStats)->everyFifteenMinutes();
})
```

Para que funcione en producción, asegúrate de configurar el cron job:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Manejo de Errores

- **Tokens expirados**: Se renuevan automáticamente usando refresh tokens
- **Canales no encontrados**: Se registra un warning en los logs
- **Errores de API**: Se capturan y registran sin interrumpir el flujo
- **Rate limiting**: El sistema respeta los límites de la API de YouTube

## Consideraciones de Rendimiento

- **Procesamiento asíncrono**: Las sincronizaciones se ejecutan en background jobs
- **Actualización selectiva**: Solo se sincronizan canales activos
- **Caché de tokens**: Los tokens se reutilizan hasta su expiración
- **Logging detallado**: Facilita el debugging y monitoreo

## Interfaz de Usuario

### Nuevas Funcionalidades

1. **Botón de sincronización individual**: Icono de refresh en cada tarjeta de canal
2. **Botón de sincronización masiva**: En la barra superior junto a "Agregar Canal"
3. **Indicadores de estado**: Los botones muestran cuando está en progreso
4. **Información de última sincronización**: Se muestra la fecha/hora de la última actualización
5. **Notificaciones**: Feedback inmediato del resultado de la operación

### Estados Visuales

- **Normal**: Botón de refresh disponible
- **Sincronizando**: Botón con spinner y deshabilitado
- **Éxito**: Notification verde con mensaje de confirmación
- **Error**: Notification roja con mensaje de error

## Próximas Mejoras

- Implementar WebSockets para actualizaciones en tiempo real sin polling
- Añadir métricas de rendimiento de la sincronización
- Configurar alertas para fallos de sincronización
- Implementar sincronización diferencial (solo cambios)
- Añadir histórico de cambios en las estadísticas
