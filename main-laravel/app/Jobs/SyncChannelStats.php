<?php

namespace App\Jobs;

use App\Models\Channel;
use App\Models\YoutubeCredential;
use Google\Client;
use Google\Service\YouTube;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncChannelStats implements ShouldQueue
{
    use Queueable;

    protected $channelId;

    /**
     * Create a new job instance.
     */
    public function __construct($channelId = null)
    {
        $this->channelId = $channelId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->channelId) {
            // Sync specific channel
            $channel = Channel::find($this->channelId);
            if ($channel) {
                $this->syncChannelStats($channel);
            }
        } else {
            // Sync all active channels
            $channels = Channel::where('status', 'active')->get();
            foreach ($channels as $channel) {
                try {
                    $this->syncChannelStats($channel);
                } catch (\Exception $e) {
                    Log::error("Error syncing stats for channel {$channel->id}: " . $e->getMessage());
                }
            }
        }
    }

    private function syncChannelStats(Channel $channel)
    {
        Log::info("Syncing stats for channel {$channel->id} ({$channel->name})");

        // Get YouTube credentials for this channel
        $credential = YoutubeCredential::where('channel_id', $channel->id)->first();

        if (!$credential) {
            Log::warning("No YouTube credentials found for channel {$channel->id}");
            return false;
        }

        // Create Google Client
        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken($credential->access_token);

        // Refresh token if needed
        if ($client->isAccessTokenExpired() || $credential->needsRefresh()) {
            Log::info("Refreshing token for channel {$channel->id}");
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
                Log::error("Failed to refresh token for channel {$channel->id}: " . $e->getMessage());
                $credential->markAsExpired();
                return false;
            }
        }

        $youtube = new YouTube($client);

        try {
            // Get channel statistics from YouTube API
            $response = $youtube->channels->listChannels('statistics,snippet', [
                'id' => $channel->youtube_channel_id,
            ]);

            if (count($response->items) > 0) {
                $channelData = $response->items[0];
                $stats = $channelData->statistics;
                $snippet = $channelData->snippet;

                // Update channel with fresh data
                $channel->update([
                    'name' => $snippet->title,
                    'description' => $snippet->description,
                    'subscriber_count' => $stats->subscriberCount ?? $channel->subscriber_count,
                    'video_count' => $stats->videoCount ?? $channel->video_count,
                    'view_count' => $stats->viewCount ?? $channel->view_count,
                    'last_sync_at' => now(),
                    'avatar_url' => $snippet->thumbnails->default->url ?? $channel->avatar_url,
                ]);

                Log::info("Successfully synced stats for channel {$channel->id}");
                return true;
            } else {
                Log::warning("Channel {$channel->youtube_channel_id} not found on YouTube");
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Error fetching channel stats for {$channel->id}: " . $e->getMessage());
            return false;
        }
    }
}