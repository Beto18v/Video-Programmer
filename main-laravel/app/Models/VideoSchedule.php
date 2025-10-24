<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class VideoSchedule extends Model
{
    protected $fillable = [
        'video_id',
        'scheduled_at',
        'status',
        'action',
        'action_parameters',
        'executed_at',
        'error_message',
        'execution_log',
        'retry_count',
        'max_retries',
        'next_retry_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'executed_at' => 'datetime',
        'next_retry_at' => 'datetime',
        'action_parameters' => 'array',
        'execution_log' => 'array',
        'retry_count' => 'integer',
        'max_retries' => 'integer',
    ];

    /**
     * El video asociado con esta programación
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Los logs de actividad relacionados con esta programación
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'entity');
    }
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Verificar si la programación está lista para ejecutar
     */
    public function isReadyToExecute(): bool
    {
        return $this->status === 'pending' && $this->scheduled_at <= now();
    }

    /**
     * Verificar si puede reintentarse
     */
    public function canRetry(): bool
    {
        return $this->status === 'failed' &&
            $this->retry_count < $this->max_retries &&
            ($this->next_retry_at === null || $this->next_retry_at <= now());
    }

    /**
     * Marcar como completado
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'executed_at' => now(),
        ]);
    }

    /**
     * Marcar como fallido e incrementar contador de reintentos
     */
    public function markAsFailed(string $errorMessage, array $executionLog = []): void
    {
        $this->increment('retry_count');

        $updateData = [
            'status' => 'failed',
            'error_message' => $errorMessage,
            'execution_log' => $executionLog,
        ];

        // Si aún puede reintentarse, programar próximo intento
        if ($this->retry_count < $this->max_retries) {
            $updateData['next_retry_at'] = now()->addMinutes(5 * $this->retry_count); // Backoff exponencial
            $updateData['status'] = 'pending'; // Mantener como pendiente para reintentar
        }

        $this->update($updateData);
    }

    /**
     * Scope para programaciones pendientes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope para programaciones listas para ejecutar
     */
    public function scopeReadyToExecute($query)
    {
        return $query->where('status', 'pending')
            ->where('scheduled_at', '<=', now());
    }

    /**
     * Scope para programaciones que pueden reintentarse
     */
    public function scopeReadyToRetry($query)
    {
        return $query->where('status', 'failed')
            ->whereColumn('retry_count', '<', 'max_retries')
            ->where(function ($query) {
                $query->whereNull('next_retry_at')
                    ->orWhere('next_retry_at', '<=', now());
            });
    }

    /**
     * Scope para programaciones de hoy
     */
    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_at', today());
    }

    /**
     * Scope para programaciones por acción
     */
    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}
