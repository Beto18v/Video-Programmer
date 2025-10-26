<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\YoutubeCredential;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;

class YoutubeCredentialsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener canales existentes
        $channels = Channel::all();

        foreach ($channels as $channel) {
            // Solo crear credenciales para canales activos
            if ($channel->status === 'active') {
                $credentialData = [
                    'channel_id' => $channel->id,
                    'access_token' => Crypt::encrypt('fake_access_token_' . $channel->youtube_channel_id),
                    'refresh_token' => Crypt::encrypt('fake_refresh_token_' . $channel->youtube_channel_id),
                    'expires_at' => now()->addHours(1),
                    'scopes' => [
                        'https://www.googleapis.com/auth/youtube',
                        'https://www.googleapis.com/auth/youtube.upload',
                        'https://www.googleapis.com/auth/youtube.readonly',
                        'https://www.googleapis.com/auth/spreadsheets.readonly'
                    ],
                    'status' => 'active',
                    'last_refreshed_at' => now()->subMinutes(rand(10, 60)),
                    'refresh_count' => rand(0, 5),
                    'token_metadata' => [
                        'client_id' => 'fake_client_id',
                        'token_type' => 'Bearer',
                        'expires_in' => 3600
                    ],
                ];

                YoutubeCredential::updateOrCreate(
                    ['channel_id' => $channel->id],
                    $credentialData
                );
            } elseif ($channel->status === 'suspended') {
                // Para canales suspendidos, crear credenciales expiradas
                $credentialData = [
                    'channel_id' => $channel->id,
                    'access_token' => Crypt::encrypt('expired_access_token_' . $channel->youtube_channel_id),
                    'refresh_token' => Crypt::encrypt('expired_refresh_token_' . $channel->youtube_channel_id),
                    'expires_at' => now()->subHours(2),
                    'scopes' => [
                        'https://www.googleapis.com/auth/youtube'
                    ],
                    'status' => 'expired',
                    'last_refreshed_at' => now()->subDays(30),
                    'refresh_count' => 10,
                    'token_metadata' => [
                        'client_id' => 'fake_client_id',
                        'error' => 'Token expired'
                    ],
                ];

                YoutubeCredential::updateOrCreate(
                    ['channel_id' => $channel->id],
                    $credentialData
                );
            }
        }
    }
}
