<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'current_plan_id',
        'first_name',
        'last_name',
        'avatar_url',
        'timezone',
        'locale',
        'is_active',
        'last_login_at',
        'preferences',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'preferences' => 'array',
        ];
    }

    /**
     * Los canales de YouTube del usuario
     */
    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class);
    }

    /**
     * El plan actual del usuario
     */
    public function currentPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'current_plan_id');
    }

    /**
     * El rol del usuario
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Los videos del usuario
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * Las suscripciones del usuario
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * La suscripción activa del usuario
     */
    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->active();
    }

    /**
     * Los logs de actividad del usuario
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Obtener el nombre completo del usuario
     */
    public function getFullNameAttribute(): string
    {
        if ($this->first_name && $this->last_name) {
            return "{$this->first_name} {$this->last_name}";
        }

        return $this->name;
    }

    /**
     * Verificar si el usuario tiene una suscripción activa
     */
    public function hasActiveSubscription(): bool
    {
        return $this->activeSubscription()->exists();
    }

    /**
     * Obtener el plan actual del usuario
     */
    public function getCurrentPlan(): ?Plan
    {
        return $this->currentPlan;
    }

    /**
     * Verificar si puede usar videos este mes
     */
    public function canUseVideos(int $quantity = 1): bool
    {
        // Los administradores no tienen límites
        if ($this->isAdmin()) {
            return true;
        }

        $plan = $this->currentPlan;

        if (!$plan) {
            return false;
        }

        // Si el plan tiene videos ilimitados
        if ($plan->hasUnlimitedVideos()) {
            return true;
        }

        // Verificar límite mensual basado en videos publicados
        $videosThisMonth = $this->videos()
            ->whereYear('published_at', now()->year)
            ->whereMonth('published_at', now()->month)
            ->where('status', 'published')
            ->count();

        return ($videosThisMonth + $quantity) <= $plan->video_limit;
    }

    /**
     * Incrementar el uso de videos (cuando se publica un video)
     */
    public function incrementVideoUsage(int $quantity = 1): void
    {
        // El incremento se maneja automáticamente al actualizar el campo published_at del video
        // No necesitamos un contador separado ya que contamos los videos publicados directamente
    }

    /**
     * Obtener videos restantes este mes
     */
    public function getRemainingVideosAttribute(): ?int
    {
        // Los administradores no tienen límites
        if ($this->isAdmin()) {
            return null; // Ilimitado
        }

        $plan = $this->currentPlan;

        if (!$plan) {
            return 0;
        }

        if ($plan->hasUnlimitedVideos()) {
            return null; // Ilimitado
        }

        $videosThisMonth = $this->videos()
            ->whereYear('published_at', now()->year)
            ->whereMonth('published_at', now()->month)
            ->where('status', 'published')
            ->count();

        return max(0, $plan->video_limit - $videosThisMonth);
    }

    /**
     * Obtener videos publicados este mes
     */
    public function getVideosThisMonthAttribute(): int
    {
        return $this->videos()
            ->whereYear('published_at', now()->year)
            ->whereMonth('published_at', now()->month)
            ->where('status', 'published')
            ->count();
    }

    /**
     * Verificar si el usuario está en el plan gratuito
     */
    public function isFreePlan(): bool
    {
        return $this->currentPlan && $this->currentPlan->name === 'free';
    }

    /**
     * Verificar si el usuario está en el plan pro
     */
    public function isProPlan(): bool
    {
        return $this->currentPlan && $this->currentPlan->name === 'pro';
    }

    /**
     * Verificar si el usuario está en el plan premium
     */
    public function isPremiumPlan(): bool
    {
        return $this->currentPlan && $this->currentPlan->name === 'premium';
    }

    /**
     * Verificar si el usuario es administrador
     */
    public function isAdmin(): bool
    {
        return $this->role && $this->role->name === 'ADMIN';
    }

    /**
     * Scope para usuarios activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Actualizar el último login
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }
}
