<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Crypt;

class YoutubeCredential extends Model
{
    protected $fillable = [
        'channel_id',
        'access_token',
        'refresh_token',
        'expires_at',
        'scopes',
        'status',
        'last_refreshed_at',
        'refresh_count',
        'token_metadata',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_refreshed_at' => 'datetime',
        'scopes' => 'array',
        'refresh_count' => 'integer',
        'token_metadata' => 'array',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * El canal al que pertenecen estas credenciales
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Los logs de actividad relacionados con estas credenciales
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'entity');
    }
    protected function accessToken(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Crypt::decryptString($value) : null,
            set: fn($value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Encriptar y desencriptar refresh_token
     */
    protected function refreshToken(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Crypt::decryptString($value) : null,
            set: fn($value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Verificar si el token está expirado
     */
    public function isExpired(): bool
    {
        return $this->expires_at <= now();
    }

    /**
     * Verificar si el token está activo
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && !$this->isExpired();
    }

    /**
     * Verificar si el token necesita ser refrescado
     */
    public function needsRefresh(): bool
    {
        return $this->expires_at <= now()->addMinutes(10);
    }

    /**
     * Scope para obtener solo credenciales activas
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope para obtener credenciales válidas (activas y no expiradas)
     */
    public function scopeValid($query)
    {
        return $query->where('status', 'active')
            ->where('expires_at', '>', now());
    }

    /**
     * Marcar las credenciales como expiradas
     */
    public function markAsExpired(): void
    {
        $this->update(['status' => 'expired']);
    }

    /**
     * Marcar las credenciales como revocadas
     */
    public function markAsRevoked(): void
    {
        $this->update(['status' => 'revoked']);
    }
}
