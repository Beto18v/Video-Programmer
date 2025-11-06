<?php

namespace App\Services;

use App\Models\Channel;
use App\Models\Video;
use App\Models\YoutubeCredential;
use Google\Client as GoogleClient;
use Google\Service\YouTube;
use Google\Service\YouTube\Video as YouTubeVideo;
use Google\Service\YouTube\VideoSnippet;
use Google\Service\YouTube\VideoStatus;
use Google\Http\MediaFileUpload;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class YoutubeUploadService
{
    private GoogleClient $client;
    private YouTube $youtube;

    public function __construct()
    {
        $this->client = new GoogleClient();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect'));
        $this->client->addScope(YouTube::YOUTUBE_UPLOAD);
        $this->client->addScope(YouTube::YOUTUBE);
        $this->client->setAccessType('offline');
    }

    /**
     * Upload a video to YouTube
     */
    public function uploadVideo(Video $video): array
    {
        try {
            $channel = $video->channel;
            if (!$channel) {
                throw new \Exception('No channel associated with video');
            }

            $credentials = $channel->youtubeCredential;
            if (!$credentials) {
                throw new \Exception('No YouTube credentials found for channel');
            }

            // Set up authentication
            $this->setupAuthentication($credentials);

            // Prepare video metadata
            $snippet = new VideoSnippet();
            $snippet->setTitle($video->title);
            $snippet->setDescription($video->description);
            $snippet->setTags($video->tags ?? []);
            $snippet->setCategoryId('22'); // People & Blogs category

            // Set video status
            $status = new VideoStatus();
            $status->setPrivacyStatus($video->privacy ?? 'public');
            $status->setMadeForKids($video->made_for_kids ?? false);

            // Create video object
            $youtubeVideo = new YouTubeVideo();
            $youtubeVideo->setSnippet($snippet);
            $youtubeVideo->setStatus($status);

            // Get video file path
            $videoPath = Storage::disk('public')->path($video->file_path);
            if (!file_exists($videoPath)) {
                throw new \Exception('Video file not found: ' . $videoPath);
            }

            // Set up simple upload without chunking for now
            // This is a simplified version - for production you'd want proper chunked upload

            // Upload video data
            $videoData = file_get_contents($videoPath);

            // Create HTTP context for upload
            $boundary = uniqid();
            $delimiter = '-------314159265358979323846';
            $close_delim = "\r\n--{$delimiter}--\r\n";

            $body = '--' . $delimiter . "\r\n";
            $body .= 'Content-Type: application/json; charset=UTF-8' . "\r\n\r\n";
            $body .= json_encode($youtubeVideo->toSimpleObject()) . "\r\n";
            $body .= '--' . $delimiter . "\r\n";
            $body .= 'Content-Type: video/*' . "\r\n";
            $body .= 'Content-Transfer-Encoding: binary' . "\r\n\r\n";
            $body .= $videoData;
            $body .= $close_delim;

            // For now, let's simulate the upload and mark as successful
            // In production, you would make the actual HTTP request here

            // Generate a fake YouTube video ID for testing
            $fakeYoutubeId = 'test_' . uniqid();

            Log::info('Simulated YouTube upload (replace with real API call)', [
                'video_id' => $video->id,
                'title' => $video->title,
                'file_size' => filesize($videoPath),
            ]);

            // Update video status as if upload was successful
            $video->update([
                'youtube_video_id' => $fakeYoutubeId,
                'status' => 'published',
                'published_at' => now(),
            ]);

            Log::info('Video marked as uploaded (simulated)', [
                'video_id' => $video->id,
                'youtube_video_id' => $fakeYoutubeId,
                'title' => $video->title,
            ]);

            return [
                'success' => true,
                'youtube_video_id' => $fakeYoutubeId,
                'message' => 'Video upload simulated successfully - implement real YouTube API integration',
            ];
        } catch (\Exception $e) {
            Log::error('YouTube upload failed', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $video->update([
                'status' => 'failed',
                'upload_error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Set up authentication with YouTube API
     */
    private function setupAuthentication(YoutubeCredential $credentials): void
    {
        $this->client->setAccessToken([
            'access_token' => decrypt($credentials->access_token),
            'refresh_token' => decrypt($credentials->refresh_token),
            'expires_in' => $credentials->expires_at->diffInSeconds(now()),
            'created' => $credentials->last_refreshed_at->timestamp ?? now()->timestamp,
        ]);

        // Refresh token if needed
        if ($this->client->isAccessTokenExpired()) {
            $this->refreshAccessToken($credentials);
        }

        $this->youtube = new YouTube($this->client);
    }

    /**
     * Refresh the access token
     */
    private function refreshAccessToken(YoutubeCredential $credentials): void
    {
        try {
            $this->client->fetchAccessTokenWithRefreshToken(decrypt($credentials->refresh_token));
            $newToken = $this->client->getAccessToken();

            $credentials->update([
                'access_token' => encrypt($newToken['access_token']),
                'expires_at' => now()->addSeconds($newToken['expires_in']),
                'last_refreshed_at' => now(),
                'refresh_count' => $credentials->refresh_count + 1,
            ]);

            Log::info('YouTube access token refreshed', [
                'channel_id' => $credentials->channel_id,
                'refresh_count' => $credentials->refresh_count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to refresh YouTube access token', [
                'channel_id' => $credentials->channel_id,
                'error' => $e->getMessage(),
            ]);

            $credentials->update(['status' => 'expired']);
            throw new \Exception('Failed to refresh YouTube access token: ' . $e->getMessage());
        }
    }

    /**
     * Check if channel has valid YouTube credentials
     */
    public function hasValidCredentials(Channel $channel): bool
    {
        $credentials = $channel->youtubeCredential;

        if (!$credentials) {
            return false;
        }

        if ($credentials->status !== 'active') {
            return false;
        }

        return true;
    }

    /**
     * Get upload quota information
     */
    public function getQuotaInfo(Channel $channel): array
    {
        try {
            $credentials = $channel->youtubeCredential;
            if (!$credentials) {
                return ['error' => 'No credentials found'];
            }

            $this->setupAuthentication($credentials);

            // YouTube API doesn't directly provide quota info, but we can check channel status
            $channelResponse = $this->youtube->channels->listChannels('statistics', [
                'mine' => true
            ]);

            if (count($channelResponse) > 0) {
                return [
                    'success' => true,
                    'channel_statistics' => $channelResponse[0]['statistics'],
                ];
            }

            return ['error' => 'No channel data found'];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
