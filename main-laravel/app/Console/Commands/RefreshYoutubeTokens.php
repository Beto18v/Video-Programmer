<?php

namespace App\Console\Commands;

use App\Models\Channel;
use App\Models\YoutubeCredential;
use Illuminate\Console\Command;
use Google\Client as GoogleClient;
use Google\Service\YouTube;

class RefreshYoutubeTokens extends Command
{
    protected $signature = 'youtube:refresh-tokens {--channel-id= : Specific channel ID to refresh}';
    protected $description = 'Refresh expired YouTube OAuth tokens';

    public function handle()
    {
        $this->info('🔄 Refreshing YouTube OAuth tokens...');
        $this->newLine();

        $channelId = $this->option('channel-id');

        if ($channelId) {
            $channels = Channel::where('id', $channelId)->with('youtubeCredentials')->get();
            if ($channels->isEmpty()) {
                $this->error("Channel with ID {$channelId} not found.");
                return 1;
            }
        } else {
            $channels = Channel::with('youtubeCredentials')->get();
        }

        $refreshed = 0;
        $failed = 0;

        foreach ($channels as $channel) {
            if (!$channel->youtubeCredentials) {
                $this->warn("Channel '{$channel->name}' has no YouTube credentials.");
                continue;
            }

            $credentials = $channel->youtubeCredentials;

            $this->info("Processing channel: {$channel->name}");

            try {
                // Create a fresh Google client
                $client = new GoogleClient();
                $client->setClientId(config('services.google.client_id'));
                $client->setClientSecret(config('services.google.client_secret'));
                $client->setRedirectUri(config('services.google.redirect'));

                // Try to refresh the token
                $client->fetchAccessTokenWithRefreshToken(decrypt($credentials->refresh_token));
                $newToken = $client->getAccessToken();

                if (!$newToken || !isset($newToken['access_token'])) {
                    throw new \Exception('Failed to get new access token');
                }

                // Update credentials
                $credentials->update([
                    'access_token' => encrypt($newToken['access_token']),
                    'expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
                    'last_refreshed_at' => now(),
                    'refresh_count' => $credentials->refresh_count + 1,
                    'status' => 'active',
                ]);

                // Test the new token
                $client->setAccessToken($newToken);
                $youtube = new YouTube($client);

                // Make a simple API call to test
                $channelResponse = $youtube->channels->listChannels('id', ['mine' => true]);

                if (count($channelResponse) > 0) {
                    $this->info("✅ Successfully refreshed token for '{$channel->name}'");
                    $refreshed++;
                } else {
                    throw new \Exception('Token test failed - no channel data returned');
                }
            } catch (\Exception $e) {
                $this->error("❌ Failed to refresh token for '{$channel->name}': " . $e->getMessage());

                // Mark as expired if refresh failed
                $credentials->update(['status' => 'expired']);
                $failed++;
            }
        }

        $this->newLine();
        $this->info("🏁 Refresh complete!");
        $this->info("✅ Successfully refreshed: {$refreshed}");

        if ($failed > 0) {
            $this->warn("❌ Failed to refresh: {$failed}");
            $this->info("💡 For failed channels, you may need to re-authenticate:");
            $this->info("   Visit: " . route('auth.google'));
        }

        return $failed > 0 ? 1 : 0;
    }
}
