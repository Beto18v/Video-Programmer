<?php

namespace App\Console\Commands;

use App\Jobs\SyncChannelStats;
use App\Models\Channel;
use Illuminate\Console\Command;

class SyncChannelStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'channels:sync-stats {channelId? : The channel ID to sync stats for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync channel statistics from YouTube API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $channelId = $this->argument('channelId');

        if ($channelId) {
            $channel = Channel::find($channelId);
            if (!$channel) {
                $this->error("Channel with ID {$channelId} not found.");
                return 1;
            }

            $this->info("Syncing stats for channel {$channel->name} (ID: {$channelId})...");
            SyncChannelStats::dispatchSync($channelId);
            $this->info('Channel stats sync completed.');
        } else {
            // Sync all active channels
            $channels = Channel::where('status', 'active')->get();
            $this->info("Syncing stats for {$channels->count()} active channels...");
            
            foreach ($channels as $channel) {
                $this->line("Syncing channel: {$channel->name}");
                SyncChannelStats::dispatch($channel->id);
            }
            
            $this->info('All channel stats sync jobs dispatched.');
        }

        return 0;
    }
}