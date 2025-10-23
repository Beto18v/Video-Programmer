<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'description',
        'metadata',
        'changes',
        'ip_address',
        'user_agent',
        'level',
        'performed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'changes' => 'array',
        'performed_at' => 'datetime',
    ];

    /**
     * El usuario que realizó la acción
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * La entidad sobre la que se realizó la acción (polimórfica)
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Crear un log de actividad
     */
    public static function log(
        string $action,
        string $description,
        ?User $user = null,
        ?Model $entity = null,
        array $metadata = [],
        array $changes = [],
        string $level = 'info'
    ): self {
        return self::create([
            'user_id' => $user?->id ?? auth()->id(),
            'action' => $action,
            'entity_type' => $entity ? get_class($entity) : null,
            'entity_id' => $entity?->id,
            'description' => $description,
            'metadata' => $metadata,
            'changes' => $changes,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'level' => $level,
            'performed_at' => now(),
        ]);
    }

    /**
     * Log para conexión de canal
     */
    public static function channelConnected(Channel $channel, ?User $user = null): self
    {
        return self::log(
            'channel_connected',
            "Canal de YouTube '{$channel->name}' conectado exitosamente",
            $user,
            $channel,
            [
                'channel_id' => $channel->youtube_channel_id,
                'subscriber_count' => $channel->subscriber_count,
            ]
        );
    }

    /**
     * Log para subida de video
     */
    public static function videoUploaded(Video $video, ?User $user = null): self
    {
        return self::log(
            'video_uploaded',
            "Video '{$video->title}' subido al canal '{$video->channel->name}'",
            $user,
            $video,
            [
                'youtube_video_id' => $video->youtube_video_id,
                'channel_name' => $video->channel->name,
                'privacy' => $video->privacy,
            ]
        );
    }

    /**
     * Log para cambio de plan
     */
    public static function planChanged(Subscription $subscription, Plan $oldPlan, ?User $user = null): self
    {
        return self::log(
            'plan_changed',
            "Plan cambiado de '{$oldPlan->display_name}' a '{$subscription->plan->display_name}'",
            $user,
            $subscription,
            [
                'old_plan' => $oldPlan->name,
                'new_plan' => $subscription->plan->name,
                'old_price' => $oldPlan->price,
                'new_price' => $subscription->plan->price,
            ],
            [
                'before' => ['plan_id' => $oldPlan->id, 'plan_name' => $oldPlan->name],
                'after' => ['plan_id' => $subscription->plan->id, 'plan_name' => $subscription->plan->name],
            ]
        );
    }

    /**
     * Log para error
     */
    public static function error(string $action, string $description, array $metadata = [], ?User $user = null): self
    {
        return self::log($action, $description, $user, null, $metadata, [], 'error');
    }

    /**
     * Scope para logs de un usuario específico
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para logs por acción
     */
    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope para logs por nivel
     */
    public function scopeForLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Scope para logs de hoy
     */
    public function scopeToday($query)
    {
        return $query->whereDate('performed_at', today());
    }

    /**
     * Scope para logs recientes
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('performed_at', '>=', now()->subDays($days));
    }

    /**
     * Scope para logs por tipo de entidad
     */
    public function scopeForEntityType($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    /**
     * Scope para ordenar por más recientes
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('performed_at', 'desc');
    }
}
