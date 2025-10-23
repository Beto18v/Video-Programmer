<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'starts_at',
        'ends_at',
        'cancelled_at',
        'payment_method',
        'mercado_pago_subscription_id',
        'mercado_pago_payment_id',
        'amount',
        'currency',
        'payment_metadata',
        'last_payment_at',
        'next_billing_at',
        'videos_used_this_month',
        'usage_reset_at',
        'auto_renew',
        'cancellation_reason',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'last_payment_at' => 'datetime',
        'next_billing_at' => 'datetime',
        'usage_reset_at' => 'datetime',
        'amount' => 'decimal:2',
        'payment_metadata' => 'array',
        'videos_used_this_month' => 'integer',
        'auto_renew' => 'boolean',
    ];

    /**
     * El usuario de la suscripción
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * El plan de la suscripción
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Verificar si la suscripción está activa
     */
    public function isActive(): bool
    {
        return $this->status === 'active' &&
            $this->starts_at <= now() &&
            $this->ends_at >= now();
    }

    /**
     * Verificar si la suscripción ha expirado
     */
    public function isExpired(): bool
    {
        return $this->ends_at < now();
    }

    /**
     * Verificar si puede usar videos este mes
     */
    public function canUseVideos(int $quantity = 1): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        // Si el plan tiene videos ilimitados
        if ($this->plan->hasUnlimitedVideos()) {
            return true;
        }

        // Verificar límite mensual
        $this->resetUsageIfNeeded();
        return ($this->videos_used_this_month + $quantity) <= $this->plan->video_limit;
    }

    /**
     * Incrementar el contador de videos usados
     */
    public function incrementVideoUsage(int $quantity = 1): void
    {
        $this->resetUsageIfNeeded();
        $this->increment('videos_used_this_month', $quantity);
    }

    /**
     * Resetear el contador si es necesario (nuevo mes)
     */
    public function resetUsageIfNeeded(): void
    {
        $resetDate = $this->usage_reset_at ?: $this->starts_at;

        if ($resetDate < now()->startOfMonth()) {
            $this->update([
                'videos_used_this_month' => 0,
                'usage_reset_at' => now()->endOfMonth(),
            ]);
        }
    }

    /**
     * Obtener videos restantes en el mes
     */
    public function getRemainingVideosAttribute(): ?int
    {
        if ($this->plan->hasUnlimitedVideos()) {
            return null; // Ilimitado
        }

        $this->resetUsageIfNeeded();
        return max(0, $this->plan->video_limit - $this->videos_used_this_month);
    }

    /**
     * Cancelar la suscripción
     */
    public function cancel(string $reason = null): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'auto_renew' => false,
            'cancellation_reason' => $reason,
        ]);
    }

    /**
     * Renovar la suscripción por un mes más
     */
    public function renew(): void
    {
        $this->update([
            'status' => 'active',
            'starts_at' => $this->ends_at,
            'ends_at' => $this->ends_at->addMonth(),
            'next_billing_at' => $this->ends_at->addMonth(),
            'videos_used_this_month' => 0,
            'usage_reset_at' => $this->ends_at->addMonth()->endOfMonth(),
        ]);
    }

    /**
     * Scope para suscripciones activas
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now());
    }

    /**
     * Scope para suscripciones expiradas
     */
    public function scopeExpired($query)
    {
        return $query->where('ends_at', '<', now());
    }

    /**
     * Scope para suscripciones que necesitan renovación
     */
    public function scopeNeedingRenewal($query)
    {
        return $query->where('status', 'active')
            ->where('auto_renew', true)
            ->where('next_billing_at', '<=', now());
    }

    /**
     * Scope para obtener la suscripción activa de un usuario
     */
    public function scopeActiveForUser($query, $userId)
    {
        return $query->where('user_id', $userId)->active();
    }

    /**
     * Scope para suscripciones por método de pago
     */
    public function scopeByPaymentMethod($query, string $method)
    {
        return $query->where('payment_method', $method);
    }
}
