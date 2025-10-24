<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ChannelsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios existentes
        $adminUser = User::where('email', 'admin@example.com')->first();
        $proUser = User::where('email', 'pro@example.com')->first();
        $freeUser = User::where('email', 'free@example.com')->first();
        $spanishUser = User::where('email', 'spanish@example.com')->first();

        $channels = [
            [
                'user_id' => $adminUser?->id,
                'youtube_channel_id' => 'UC_admin_channel_001',
                'name' => 'Admin Tech Channel',
                'custom_url' => '@admintech',
                'description' => 'Canal oficial para contenido técnico y tutoriales avanzados.',
                'subscriber_count' => 50000,
                'video_count' => 150,
                'view_count' => 2500000,
                'status' => 'active',
                'connected_at' => now()->subDays(30),
                'last_sync_at' => now()->subHours(2),
                'channel_metadata' => [
                    'country' => 'US',
                    'default_language' => 'en',
                    'featured_channels' => ['UC_pro_channel_001']
                ],
            ],
            [
                'user_id' => $adminUser?->id,
                'youtube_channel_id' => 'UC_admin_channel_002',
                'name' => 'Admin Gaming Channel',
                'custom_url' => '@admingaming',
                'description' => 'Juegos y entretenimiento para todos.',
                'subscriber_count' => 25000,
                'video_count' => 75,
                'view_count' => 1200000,
                'status' => 'active',
                'connected_at' => now()->subDays(15),
                'last_sync_at' => now()->subHours(1),
                'channel_metadata' => [
                    'country' => 'US',
                    'default_language' => 'en'
                ],
            ],
            [
                'user_id' => $proUser?->id,
                'youtube_channel_id' => 'UC_pro_channel_001',
                'name' => 'Pro Content Creator',
                'custom_url' => '@procreator',
                'description' => 'Contenido profesional de alta calidad.',
                'subscriber_count' => 15000,
                'video_count' => 45,
                'view_count' => 750000,
                'status' => 'active',
                'connected_at' => now()->subDays(20),
                'last_sync_at' => now()->subHours(3),
                'channel_metadata' => [
                    'country' => 'GB',
                    'default_language' => 'en'
                ],
            ],
            [
                'user_id' => $freeUser?->id,
                'youtube_channel_id' => 'UC_free_channel_001',
                'name' => 'Free User Channel',
                'custom_url' => '@freechannel',
                'description' => 'Canal de prueba para usuarios gratuitos.',
                'subscriber_count' => 500,
                'video_count' => 3,
                'view_count' => 2500,
                'status' => 'active',
                'connected_at' => now()->subDays(5),
                'last_sync_at' => now()->subHours(12),
                'channel_metadata' => [
                    'country' => 'US',
                    'default_language' => 'en'
                ],
            ],
            [
                'user_id' => $spanishUser?->id,
                'youtube_channel_id' => 'UC_spanish_channel_001',
                'name' => 'Canal Español',
                'custom_url' => '@canalespanol',
                'description' => 'Contenido en español para la comunidad hispanohablante.',
                'subscriber_count' => 8000,
                'video_count' => 25,
                'view_count' => 400000,
                'status' => 'active',
                'connected_at' => now()->subDays(10),
                'last_sync_at' => now()->subHours(6),
                'channel_metadata' => [
                    'country' => 'ES',
                    'default_language' => 'es'
                ],
            ],
            [
                'user_id' => $adminUser?->id,
                'youtube_channel_id' => 'UC_admin_channel_003',
                'name' => 'Suspended Channel',
                'custom_url' => '@suspended',
                'description' => 'Canal suspendido para pruebas.',
                'subscriber_count' => 0,
                'video_count' => 0,
                'view_count' => 0,
                'status' => 'suspended',
                'connected_at' => now()->subDays(60),
                'last_sync_at' => now()->subDays(30),
                'channel_metadata' => [
                    'country' => 'US',
                    'default_language' => 'en'
                ],
            ],
        ];

        foreach ($channels as $channelData) {
            if ($channelData['user_id']) {
                Channel::updateOrCreate(
                    ['youtube_channel_id' => $channelData['youtube_channel_id']],
                    $channelData
                );
            }
        }
    }
}
