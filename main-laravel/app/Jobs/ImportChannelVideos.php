<?php

namespace App\Jobs;

use App\Models\Channel;
use App\Models\Video;
use App\Models\YoutubeCredential;
use Google\Client;
use Google\Service\YouTube;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ImportChannelVideos implements ShouldQueue
{
    use Queueable;

    protected $channelId;

    /**
     * Create a new job instance.
     */
    public function __construct($channelId)
    {
        $this->channelId = $channelId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $channel = Channel::find($this->channelId);
        if (!$channel) {
            Log::error("Channel {$this->channelId} not found");
            return;
        }

        $credential = YoutubeCredential::where('channel_id', $this->channelId)->first();
        if (!$credential) {
            Log::warning("No YouTube credentials found for channel {$this->channelId}");
            return;
        }

        $this->importVideos($channel, $credential);
    }

    private function importVideos(Channel $channel, YoutubeCredential $credential)
    {
        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken($credential->access_token);

        // Refresh token if needed
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
                Log::error("Failed to refresh token for channel {$channel->id}: " . $e->getMessage());
                $credential->markAsExpired();
                return;
            }
        }

        $youtube = new YouTube($client);

        // Get channel details to find uploads playlist
        $channelResponse = $youtube->channels->listChannels('contentDetails', [
            'id' => $channel->youtube_channel_id,
        ]);

        if (empty($channelResponse->items)) {
            Log::error("Channel {$channel->youtube_channel_id} not found on YouTube");
            return;
        }

        $uploadsPlaylistId = $channelResponse->items[0]->contentDetails->relatedPlaylists->uploads;

        // Get playlist items
        $nextPageToken = null;
        do {
            $playlistResponse = $youtube->playlistItems->listPlaylistItems('snippet,contentDetails,status', [
                'playlistId' => $uploadsPlaylistId,
                'maxResults' => 50,
                'pageToken' => $nextPageToken,
            ]);

            foreach ($playlistResponse->items as $item) {
                $videoId = $item->contentDetails->videoId;
                $snippet = $item->snippet;

                // Get video details
                $videoResponse = $youtube->videos->listVideos('snippet,statistics,contentDetails', [
                    'id' => $videoId,
                ]);

                if (!empty($videoResponse->items)) {
                    $videoData = $videoResponse->items[0];
                    $videoSnippet = $videoData->snippet;
                    $statistics = $videoData->statistics;
                    $contentDetails = $videoData->contentDetails;

                    Video::updateOrCreate(
                        ['youtube_video_id' => $videoId],
                        [
                            'user_id' => $channel->user_id,
                            'channel_id' => $channel->id,
                            'title' => $videoSnippet->title,
                            'description' => $videoSnippet->description,
                            'privacy' => $videoSnippet->privacyStatus ?? 'public',
                            'published_at' => $videoSnippet->publishedAt,
                            'thumbnail_url' => $videoSnippet->thumbnails->default->url ?? null,
                            'duration' => $contentDetails->duration ?? null,
                            'view_count' => $statistics->viewCount ?? 0,
                            'like_count' => $statistics->likeCount ?? 0,
                            'comment_count' => $statistics->commentCount ?? 0,
                            'tags' => $videoSnippet->tags ?? [],
                            'category_id' => $videoSnippet->categoryId ?? null,
                            'language' => $videoSnippet->defaultLanguage ?? 'es',
                        ]
                    );

                    Log::info("Imported/Updated video: {$videoSnippet->title}");
                }
            }

            $nextPageToken = $playlistResponse->nextPageToken;
        } while ($nextPageToken);

        // Update channel last_sync_at
        $channel->update(['last_sync_at' => now()]);
    }
}
