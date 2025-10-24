<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Channel extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'user_id',
        'youtube_channel_id',
        'name',
        'custom_url',
        'description',
        'avatar_url',
        'banner_url',
        'subscriber_count',
        'video_count',
        'view_count',
        'status',
        'connected_at',
        'last_sync_at',
        'channel_metadata',
    ];

    protected $casts = [
        'subscriber_count' => 'integer',
        'video_count' => 'integer',
        'view_count' => 'integer',
        'connected_at' => 'datetime',
        'last_sync_at' => 'datetime',
        'channel_metadata' => 'array',
    ];

    /**
     * El usuario propietario del canal
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Las credenciales de YouTube para este canal
     */
    public function youtubeCredentials(): HasOne
    {
        return $this->hasOne(YoutubeCredential::class);
    }

    /**
     * Los videos de este canal
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * Los logs de actividad relacionados con este canal
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'entity');
    }
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Scope para obtener solo canales activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope para canales de un usuario específico
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Obtener la URL completa del canal
     */
    public function getChannelUrlAttribute(): string
    {
        if ($this->custom_url) {
            return "https://www.youtube.com/{$this->custom_url}";
        }

        return "https://www.youtube.com/channel/{$this->youtube_channel_id}";
    }
}
