<?php

namespace Database\Seeders;

use App\Models\Video;
use App\Models\VideoSchedule;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VideoSchedulesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener videos que necesitan schedules
        $scheduledVideos = Video::whereNotNull('scheduled_for')->orWhere('status', 'uploaded')->get();
        $draftVideos = Video::where('status', 'draft')->get();

        $schedules = [];

        // Schedules para videos programados
        foreach ($scheduledVideos as $video) {
            if ($video->scheduled_for) {
                $schedules[] = [
                    'video_id' => $video->id,
                    'scheduled_at' => $video->scheduled_for,
                    'status' => 'pending',
                    'action' => 'publish',
                    'action_parameters' => [
                        'privacy' => $video->privacy,
                        'notify_subscribers' => true
                    ],
                    'max_retries' => 3,
                ];
            } elseif ($video->status === 'uploaded') {
                $schedules[] = [
                    'video_id' => $video->id,
                    'scheduled_at' => now()->addHours(1),
                    'status' => 'pending',
                    'action' => 'publish',
                    'action_parameters' => [
                        'privacy' => 'public',
                        'notify_subscribers' => false
                    ],
                    'max_retries' => 3,
                ];
            }
        }

        // Schedules para videos en borrador (simular subida futura)
        foreach ($draftVideos->take(2) as $video) {
            $schedules[] = [
                'video_id' => $video->id,
                'scheduled_at' => now()->addDays(rand(1, 7)),
                'status' => 'pending',
                'action' => 'upload',
                'action_parameters' => [
                    'title' => $video->title,
                    'description' => $video->description,
                    'tags' => $video->tags,
                    'privacy' => $video->privacy,
                    'category_id' => $video->category_id
                ],
                'max_retries' => 3,
            ];
        }

        // Schedule completado
        $publishedVideo = Video::where('status', 'published')->first();
        if ($publishedVideo) {
            $schedules[] = [
                'video_id' => $publishedVideo->id,
                'scheduled_at' => $publishedVideo->published_at ?? now()->subDays(1),
                'status' => 'completed',
                'action' => 'publish',
                'action_parameters' => [
                    'privacy' => 'public',
                    'notify_subscribers' => true
                ],
                'executed_at' => $publishedVideo->published_at ?? now()->subDays(1),
                'execution_log' => [
                    'success' => true,
                    'youtube_video_id' => $publishedVideo->youtube_video_id,
                    'published_at' => $publishedVideo->published_at?->toISOString()
                ],
                'max_retries' => 3,
            ];
        }

        // Schedule fallido
        $failedVideo = Video::where('status', 'failed')->first();
        if ($failedVideo) {
            $schedules[] = [
                'video_id' => $failedVideo->id,
                'scheduled_at' => now()->subDays(2),
                'status' => 'failed',
                'action' => 'upload',
                'action_parameters' => [
                    'title' => $failedVideo->title,
                    'description' => $failedVideo->description
                ],
                'executed_at' => now()->subDays(2)->addMinutes(30),
                'error_message' => 'Upload failed: Network timeout',
                'execution_log' => [
                    'success' => false,
                    'error' => 'Network timeout during upload',
                    'attempts' => 3
                ],
                'retry_count' => 3,
                'max_retries' => 3,
                'next_retry_at' => now()->subDays(2)->addHours(1),
            ];
        }

        // Schedule en procesamiento
        $processingVideo = Video::where('status', 'uploaded')->first();
        if ($processingVideo) {
            $schedules[] = [
                'video_id' => $processingVideo->id,
                'scheduled_at' => now()->subMinutes(30),
                'status' => 'processing',
                'action' => 'publish',
                'action_parameters' => [
                    'privacy' => 'public'
                ],
                'execution_log' => [
                    'status' => 'uploading_to_youtube',
                    'progress' => 75
                ],
                'max_retries' => 3,
            ];
        }

        foreach ($schedules as $scheduleData) {
            VideoSchedule::create($scheduleData);
        }
    }
}
