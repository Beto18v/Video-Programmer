<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'price',
        'video_limit',
        'is_active',
        'sort_order',
        'features',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'video_limit' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'features' => 'array',
    ];

    /**
     * Obtener las suscripciones de este plan
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Verificar si el plan es gratuito
     */
    public function isFree(): bool
    {
        return $this->name === 'free' || $this->price == 0;
    }

    /**
     * Verificar si el plan tiene videos ilimitados
     */
    public function hasUnlimitedVideos(): bool
    {
        return is_null($this->video_limit);
    }

    /**
     * Scope para obtener solo planes activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para ordenar por orden de clasificación
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }
}
