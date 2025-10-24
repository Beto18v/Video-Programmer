<?php

namespace App\Jobs;

use App\Models\Video;
use App\Models\YoutubeCredential;
use Google\Client;
use Google\Service\YouTube;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncVideoStats implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Obtener todos los videos que tienen youtube_video_id
        $videos = Video::whereNotNull('youtube_video_id')->get();

        foreach ($videos as $video) {
            try {
                $this->syncVideoStats($video);
            } catch (\Exception $e) {
                Log::error("Error syncing stats for video {$video->id}: " . $e->getMessage());
            }
        }
    }

    private function syncVideoStats(Video $video)
    {
        // Obtener las credenciales del canal del video
        $credential = YoutubeCredential::where('channel_id', $video->channel_id)->first();

        if (!$credential) {
            Log::warning("No YouTube credentials found for channel {$video->channel_id}");
            return;
        }

        // Crear cliente de Google
        $client = new Client();
        $client->setClientId(config('services.google.client_id')); // Asumir que está configurado
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken($credential->access_token);

        // Si el token expiró o necesita refresh, refrescarlo
        if ($client->isAccessTokenExpired() || $credential->needsRefresh()) {
            try {
                $client->refreshToken($credential->refresh_token);
                $newToken = $client->getAccessToken();

                $credential->update([
                    'access_token' => $newToken['access_token'],
                    'expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
                    'last_refreshed_at' => now(),
                    'refresh_count' => $credential->refresh_count + 1,
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to refresh token for channel {$video->channel_id}: " . $e->getMessage());
                $credential->markAsExpired();
                return;
            }
        }

        $youtube = new YouTube($client);

        // Obtener estadísticas del video
        $response = $youtube->videos->listVideos('statistics', [
            'id' => $video->youtube_video_id,
        ]);

        if (count($response->items) > 0) {
            $stats = $response->items[0]->statistics;

            // Actualizar el video
            $video->update([
                'view_count' => $stats->viewCount ?? $video->view_count,
                'like_count' => $stats->likeCount ?? $video->like_count,
                'comment_count' => $stats->commentCount ?? $video->comment_count,
            ]);

            Log::info("Updated stats for video {$video->id}: views={$stats->viewCount}, likes={$stats->likeCount}, comments={$stats->commentCount}");
        } else {
            Log::warning("No stats found for video {$video->youtube_video_id}");
        }
    }
}
