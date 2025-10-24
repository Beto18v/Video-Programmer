<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Channel;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ActivityLogsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener algunas entidades para los logs
        $adminUser = User::where('email', 'admin@example.com')->first();
        $proUser = User::where('email', 'pro@example.com')->first();
        $freeUser = User::where('email', 'free@example.com')->first();

        $adminChannel = Channel::where('user_id', $adminUser?->id)->first();
        $proChannel = Channel::where('user_id', $proUser?->id)->first();

        $publishedVideo = Video::where('status', 'published')->first();
        $adminSubscription = Subscription::where('user_id', $adminUser?->id)->first();

        $activityLogs = [];

        // Logs de conexión de canales
        if ($adminChannel) {
            $activityLogs[] = [
                'user_id' => $adminUser->id,
                'action' => 'channel_connected',
                'entity_type' => 'Channel',
                'entity_id' => $adminChannel->id,
                'description' => "Connected YouTube channel '{$adminChannel->name}'",
                'metadata' => [
                    'channel_id' => $adminChannel->youtube_channel_id,
                    'subscriber_count' => $adminChannel->subscriber_count
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'level' => 'info',
                'performed_at' => $adminChannel->connected_at,
            ];
        }

        if ($proChannel) {
            $activityLogs[] = [
                'user_id' => $proUser->id,
                'action' => 'channel_connected',
                'entity_type' => 'Channel',
                'entity_id' => $proChannel->id,
                'description' => "Connected YouTube channel '{$proChannel->name}'",
                'metadata' => [
                    'channel_id' => $proChannel->youtube_channel_id,
                    'subscriber_count' => $proChannel->subscriber_count
                ],
                'ip_address' => '10.0.0.50',
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'level' => 'info',
                'performed_at' => $proChannel->connected_at,
            ];
        }

        // Logs de subida de videos
        if ($publishedVideo) {
            $activityLogs[] = [
                'user_id' => $publishedVideo->user_id,
                'action' => 'video_uploaded',
                'entity_type' => 'Video',
                'entity_id' => $publishedVideo->id,
                'description' => "Uploaded video '{$publishedVideo->title}'",
                'metadata' => [
                    'video_title' => $publishedVideo->title,
                    'youtube_video_id' => $publishedVideo->youtube_video_id,
                    'channel_id' => $publishedVideo->channel->youtube_channel_id ?? null
                ],
                'changes' => [
                    'before' => null,
                    'after' => [
                        'status' => 'published',
                        'youtube_video_id' => $publishedVideo->youtube_video_id
                    ]
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'level' => 'info',
                'performed_at' => $publishedVideo->published_at ?? now()->subDays(5),
            ];
        }

        // Logs de cambio de plan/suscripción
        if ($adminSubscription) {
            $activityLogs[] = [
                'user_id' => $adminUser->id,
                'action' => 'plan_changed',
                'entity_type' => 'Subscription',
                'entity_id' => $adminSubscription->id,
                'description' => "Changed plan to '{$adminSubscription->plan->display_name}'",
                'metadata' => [
                    'plan_name' => $adminSubscription->plan->name,
                    'plan_display_name' => $adminSubscription->plan->display_name,
                    'amount' => $adminSubscription->amount
                ],
                'changes' => [
                    'before' => ['plan' => 'free'],
                    'after' => ['plan' => $adminSubscription->plan->name]
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'level' => 'info',
                'performed_at' => $adminSubscription->starts_at,
            ];
        }

        // Logs de login
        $activityLogs[] = [
            'user_id' => $adminUser->id,
            'action' => 'user_login',
            'entity_type' => null,
            'entity_id' => null,
            'description' => 'User logged in',
            'metadata' => [
                'login_method' => 'email'
            ],
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'level' => 'info',
            'performed_at' => now()->subHours(2),
        ];

        $activityLogs[] = [
            'user_id' => $proUser->id,
            'action' => 'user_login',
            'entity_type' => null,
            'entity_id' => null,
            'description' => 'User logged in',
            'metadata' => [
                'login_method' => 'email'
            ],
            'ip_address' => '10.0.0.50',
            'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'level' => 'info',
            'performed_at' => now()->subHours(1),
        ];

        // Log de error de subida
        $failedVideo = Video::where('status', 'failed')->first();
        if ($failedVideo) {
            $activityLogs[] = [
                'user_id' => $failedVideo->user_id,
                'action' => 'video_upload_failed',
                'entity_type' => 'Video',
                'entity_id' => $failedVideo->id,
                'description' => "Failed to upload video '{$failedVideo->title}'",
                'metadata' => [
                    'video_title' => $failedVideo->title,
                    'error' => $failedVideo->upload_error
                ],
                'ip_address' => '10.0.0.50',
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'level' => 'error',
                'performed_at' => now()->subDays(2),
            ];
        }

        // Log de actualización de perfil
        $activityLogs[] = [
            'user_id' => $freeUser->id,
            'action' => 'profile_updated',
            'entity_type' => 'User',
            'entity_id' => $freeUser->id,
            'description' => 'Updated user profile',
            'metadata' => [
                'fields_updated' => ['first_name', 'last_name', 'timezone']
            ],
            'changes' => [
                'before' => ['timezone' => 'UTC'],
                'after' => ['timezone' => 'America/Los_Angeles']
            ],
            'ip_address' => '172.16.0.25',
            'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'level' => 'info',
            'performed_at' => now()->subDays(3),
        ];

        // Log de intento de acceso fallido (sin user_id)
        $activityLogs[] = [
            'user_id' => null,
            'action' => 'login_failed',
            'entity_type' => null,
            'entity_id' => null,
            'description' => 'Failed login attempt',
            'metadata' => [
                'email' => 'unknown@example.com',
                'reason' => 'invalid_credentials'
            ],
            'ip_address' => '203.0.113.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'level' => 'warning',
            'performed_at' => now()->subMinutes(30),
        ];

        // Log de canal suspendido
        $suspendedChannel = Channel::where('status', 'suspended')->first();
        if ($suspendedChannel) {
            $activityLogs[] = [
                'user_id' => $suspendedChannel->user_id,
                'action' => 'channel_suspended',
                'entity_type' => 'Channel',
                'entity_id' => $suspendedChannel->id,
                'description' => "YouTube channel '{$suspendedChannel->name}' was suspended",
                'metadata' => [
                    'channel_id' => $suspendedChannel->youtube_channel_id,
                    'reason' => 'community_guidelines_violation'
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'System',
                'level' => 'critical',
                'performed_at' => now()->subDays(30),
            ];
        }

        foreach ($activityLogs as $logData) {
            ActivityLog::create($logData);
        }
    }
}
