<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Video extends Model
{
    protected $fillable = [
        'user_id',
        'channel_id',
        'title',
        'description',
        'file_path',
        'thumbnail_path',
        'thumbnail_url',
        'status',
        'youtube_video_id',
        'privacy',
        'tags',
        'category_id',
        'language',
        'made_for_kids',
        'scheduled_for',
        'published_at',
        'upload_error',
        'video_metadata',
        'file_size',
        'duration',
        'view_count',
        'like_count',
        'comment_count',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'published_at' => 'datetime',
        'tags' => 'array',
        'made_for_kids' => 'boolean',
        'video_metadata' => 'array',
        'file_size' => 'integer',
        'view_count' => 'integer',
        'like_count' => 'integer',
        'comment_count' => 'integer',
    ];

    /**
     * El usuario propietario del video
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * El canal donde se publicará el video
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Las programaciones de este video
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(VideoSchedule::class);
    }

    /**
     * Verificar si el video está programado
     */
    public function isScheduled(): bool
    {
        return !is_null($this->scheduled_for) && $this->scheduled_for > now();
    }

    /**
     * Verificar si el video está publicado
     */
    public function isPublished(): bool
    {
        return $this->status === 'published' && !is_null($this->youtube_video_id);
    }

    /**
     * Verificar si el video está listo para subir
     */
    public function isReadyToUpload(): bool
    {
        return $this->status === 'pending' &&
            !is_null($this->file_path) &&
            Storage::exists($this->file_path);
    }

    /**
     * Obtener la URL del video en YouTube
     */
    public function getYoutubeUrlAttribute(): ?string
    {
        return $this->youtube_video_id
            ? "https://www.youtube.com/watch?v={$this->youtube_video_id}"
            : null;
    }

    /**
     * Obtener la URL de la miniatura
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->attributes['thumbnail_url']) {
            return $this->attributes['thumbnail_url'];
        }

        if ($this->thumbnail_path && Storage::exists($this->thumbnail_path)) {
            return Storage::url($this->thumbnail_path);
        }

        return null;
    }

    /**
     * Obtener el tamaño del archivo formateado
     */
    public function getFormattedFileSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'N/A';
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Scope para videos programados
     */
    public function scopeScheduled($query)
    {
        return $query->whereNotNull('scheduled_for')
            ->where('scheduled_for', '>', now());
    }

    /**
     * Scope para videos listos para subir
     */
    public function scopeReadyToUpload($query)
    {
        return $query->where('status', 'pending')
            ->whereNotNull('file_path');
    }

    /**
     * Scope para videos de un usuario específico
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para videos de un canal específico
     */
    public function scopeForChannel($query, $channelId)
    {
        return $query->where('channel_id', $channelId);
    }

    /**
     * Scope para videos publicados en un mes específico
     */
    public function scopePublishedInMonth($query, $year, $month)
    {
        return $query->whereYear('published_at', $year)
            ->whereMonth('published_at', $month)
            ->where('status', 'published');
    }
}
