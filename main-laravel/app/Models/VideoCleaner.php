<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoCleaner extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'original_filename',
        'input_path',
        'output_path',
        'status', // pending, processing, completed, failed
        'progress', // 0-100
        'error_message',
        'watermark_positions', // JSON: array of positions
        'batch_id', // For batch processing
    ];

    protected $casts = [
        'watermark_positions' => 'array',
        'progress' => 'integer',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
