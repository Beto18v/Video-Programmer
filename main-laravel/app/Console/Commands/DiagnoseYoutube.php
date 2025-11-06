<?php

namespace App\Console\Commands;

use App\Models\Channel;
use App\Models\YoutubeCredential;
use App\Services\YoutubeUploadService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;

class DiagnoseYoutube extends Command
{
    protected $signature = 'youtube:diagnose';
    protected $description = 'Diagnose YouTube configuration and credentials';

    public function handle()
    {
        $this->info('🔍 Diagnosing YouTube Configuration...');
        $this->newLine();

        // Check environment variables
        $this->info('📋 Environment Variables:');
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect');

        $this->table(['Variable', 'Status'], [
            ['GOOGLE_CLIENT_ID', $clientId ? '✅ Configured' : '❌ Missing'],
            ['GOOGLE_CLIENT_SECRET', $clientSecret ? '✅ Configured' : '❌ Missing'],
            ['GOOGLE_REDIRECT_URI', $redirectUri ? '✅ Configured' : '❌ Missing'],
        ]);

        if (!$clientId || !$clientSecret || !$redirectUri) {
            $this->error('⚠️  Google OAuth credentials are not properly configured!');
            $this->info('Please add the following to your .env file:');
            $this->info('GOOGLE_CLIENT_ID=your_client_id');
            $this->info('GOOGLE_CLIENT_SECRET=your_client_secret');
            $this->info('GOOGLE_REDIRECT_URI=your_redirect_uri');
            $this->newLine();
        }

        // Check channels with YouTube credentials
        $this->info('📺 YouTube Channels and Credentials:');
        $channels = Channel::with('youtubeCredentials')->get();

        if ($channels->isEmpty()) {
            $this->warn('No channels found. Please connect a YouTube channel first.');
            return;
        }

        foreach ($channels as $channel) {
            $this->info("Channel: {$channel->name} (ID: {$channel->id})");

            if ($channel->youtubeCredentials) {
                $credential = $channel->youtubeCredentials;
                $this->table(['Property', 'Value'], [
                    ['Status', $credential->status],
                    ['Expires At', $credential->expires_at],
                    ['Last Refreshed', $credential->last_refreshed_at ?? 'Never'],
                    ['Refresh Count', $credential->refresh_count],
                    ['Scopes', implode(', ', $credential->scopes)],
                ]);

                // Check if credentials are expired
                if ($credential->expires_at && $credential->expires_at->isPast()) {
                    $this->warn('⚠️  Access token has expired!');
                }

                // Test credentials
                $this->info('🧪 Testing YouTube API connection...');
                try {
                    $youtubeService = new YoutubeUploadService();
                    if ($youtubeService->hasValidCredentials($channel)) {
                        $quotaInfo = $youtubeService->getQuotaInfo($channel);
                        if (isset($quotaInfo['success']) && $quotaInfo['success']) {
                            $this->info('✅ YouTube API connection successful!');
                        } else {
                            $this->error('❌ YouTube API connection failed: ' . ($quotaInfo['error'] ?? 'Unknown error'));
                        }
                    } else {
                        $this->error('❌ Invalid YouTube credentials');
                    }
                } catch (\Exception $e) {
                    $this->error('❌ Error testing YouTube API: ' . $e->getMessage());
                }
            } else {
                $this->warn('❌ No YouTube credentials found for this channel');
            }

            $this->newLine();
        }

        // Check upload scope
        $this->info('🔑 Checking Upload Permissions:');
        $channelsWithUploadScope = YoutubeCredential::whereJsonContains('scopes', 'https://www.googleapis.com/auth/youtube.upload')
            ->orWhereJsonContains('scopes', 'https://www.googleapis.com/auth/youtube')
            ->count();

        if ($channelsWithUploadScope > 0) {
            $this->info("✅ {$channelsWithUploadScope} channel(s) have upload permissions");
        } else {
            $this->warn('⚠️  No channels have upload permissions! Please re-authenticate with upload scope.');
        }

        $this->newLine();
        $this->info('🏁 Diagnosis complete!');
    }
}
