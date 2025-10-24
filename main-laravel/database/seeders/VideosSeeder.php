<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VideosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios y canales
        $adminUser = User::where('email', 'admin@example.com')->first();
        $proUser = User::where('email', 'pro@example.com')->first();
        $freeUser = User::where('email', 'free@example.com')->first();
        $spanishUser = User::where('email', 'spanish@example.com')->first();

        $adminChannels = Channel::where('user_id', $adminUser?->id)->get();
        $proChannels = Channel::where('user_id', $proUser?->id)->get();
        $freeChannels = Channel::where('user_id', $freeUser?->id)->get();
        $spanishChannels = Channel::where('user_id', $spanishUser?->id)->get();

        $videos = [];

        // Videos para usuario admin
        if ($adminChannels->count() > 0) {
            $videos = array_merge($videos, [
                [
                    'user_id' => $adminUser->id,
                    'channel_id' => $adminChannels->first()->id,
                    'title' => 'Tutorial Avanzado de Laravel',
                    'description' => 'Aprende técnicas avanzadas de desarrollo con Laravel en este tutorial completo.',
                    'status' => 'published',
                    'youtube_video_id' => 'yt_admin_video_001',
                    'privacy' => 'public',
                    'tags' => ['laravel', 'php', 'tutorial', 'web development'],
                    'category_id' => '28',
                    'language' => 'es',
                    'made_for_kids' => false,
                    'published_at' => now()->subDays(5),
                    'duration' => '15:30',
                    'view_count' => 12500,
                    'like_count' => 450,
                    'comment_count' => 89,
                    'video_metadata' => [
                        'resolution' => '1080p',
                        'format' => 'mp4',
                        'encoding' => 'H.264'
                    ],
                ],
                [
                    'user_id' => $adminUser->id,
                    'channel_id' => $adminChannels->first()->id,
                    'title' => 'Video Programado - Publicación Automática',
                    'description' => 'Este video está programado para publicarse automáticamente.',
                    'status' => 'uploaded',
                    'youtube_video_id' => 'yt_admin_video_002',
                    'privacy' => 'private',
                    'tags' => ['automation', 'youtube', 'programming'],
                    'category_id' => '28',
                    'language' => 'en',
                    'made_for_kids' => false,
                    'scheduled_for' => now()->addDays(2),
                    'duration' => '08:45',
                    'view_count' => 0,
                    'like_count' => 0,
                    'comment_count' => 0,
                    'video_metadata' => [
                        'resolution' => '720p',
                        'format' => 'mp4'
                    ],
                ],
                [
                    'user_id' => $adminUser->id,
                    'channel_id' => $adminChannels->skip(1)->first()?->id ?? $adminChannels->first()->id,
                    'title' => 'Gaming Session - Live Stream',
                    'description' => 'Sesión de gaming en vivo con amigos.',
                    'status' => 'draft',
                    'privacy' => 'private',
                    'tags' => ['gaming', 'live', 'entertainment'],
                    'category_id' => '20',
                    'language' => 'en',
                    'made_for_kids' => false,
                    'duration' => '45:12',
                    'video_metadata' => [
                        'resolution' => '1080p',
                        'format' => 'mp4',
                        'game' => 'Unknown Game'
                    ],
                ],
            ]);
        }

        // Videos para usuario pro
        if ($proChannels->count() > 0) {
            $videos = array_merge($videos, [
                [
                    'user_id' => $proUser->id,
                    'channel_id' => $proChannels->first()->id,
                    'title' => 'Content Creation Tips',
                    'description' => 'Professional tips for creating engaging content on YouTube.',
                    'status' => 'published',
                    'youtube_video_id' => 'yt_pro_video_001',
                    'privacy' => 'public',
                    'tags' => ['content creation', 'youtube', 'tips'],
                    'category_id' => '27',
                    'language' => 'en',
                    'made_for_kids' => false,
                    'published_at' => now()->subDays(10),
                    'duration' => '12:20',
                    'view_count' => 8750,
                    'like_count' => 320,
                    'comment_count' => 67,
                    'video_metadata' => [
                        'resolution' => '1080p',
                        'format' => 'mp4'
                    ],
                ],
                [
                    'user_id' => $proUser->id,
                    'channel_id' => $proChannels->first()->id,
                    'title' => 'Failed Upload Test',
                    'description' => 'This video failed to upload due to an error.',
                    'status' => 'failed',
                    'privacy' => 'private',
                    'tags' => ['test', 'failed'],
                    'category_id' => '22',
                    'language' => 'en',
                    'made_for_kids' => false,
                    'upload_error' => 'Network timeout during upload',
                    'video_metadata' => [
                        'resolution' => '720p',
                        'format' => 'mp4',
                        'error_code' => 'NETWORK_ERROR'
                    ],
                ],
            ]);
        }

        // Videos para usuario free
        if ($freeChannels->count() > 0) {
            $videos = array_merge($videos, [
                [
                    'user_id' => $freeUser->id,
                    'channel_id' => $freeChannels->first()->id,
                    'title' => 'My First Video',
                    'description' => 'This is my very first video on YouTube!',
                    'status' => 'published',
                    'youtube_video_id' => 'yt_free_video_001',
                    'privacy' => 'public',
                    'tags' => ['first video', 'introduction'],
                    'category_id' => '22',
                    'language' => 'en',
                    'made_for_kids' => false,
                    'published_at' => now()->subDays(2),
                    'duration' => '03:15',
                    'view_count' => 150,
                    'like_count' => 12,
                    'comment_count' => 5,
                    'video_metadata' => [
                        'resolution' => '720p',
                        'format' => 'mp4'
                    ],
                ],
            ]);
        }

        // Videos para usuario español
        if ($spanishChannels->count() > 0) {
            $videos = array_merge($videos, [
                [
                    'user_id' => $spanishUser->id,
                    'channel_id' => $spanishChannels->first()->id,
                    'title' => 'Tutorial de Programación en Español',
                    'description' => 'Aprende a programar con este tutorial en español.',
                    'status' => 'published',
                    'youtube_video_id' => 'yt_spanish_video_001',
                    'privacy' => 'public',
                    'tags' => ['programación', 'tutorial', 'español'],
                    'category_id' => '28',
                    'language' => 'es',
                    'made_for_kids' => false,
                    'published_at' => now()->subDays(7),
                    'duration' => '20:45',
                    'view_count' => 5200,
                    'like_count' => 180,
                    'comment_count' => 42,
                    'video_metadata' => [
                        'resolution' => '1080p',
                        'format' => 'mp4'
                    ],
                ],
            ]);
        }

        foreach ($videos as $videoData) {
            Video::create($videoData);
        }
    }
}
