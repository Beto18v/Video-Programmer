<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ImportChannelVideosCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'videos:import {channelId? : The channel ID to import videos for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import videos from YouTube for a channel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $channelId = $this->argument('channelId');

        if ($channelId) {
            $this->info("Importing videos for channel {$channelId}...");
            \App\Jobs\ImportChannelVideos::dispatchSync($channelId);
        } else {
            // Import for all channels
            $channels = \App\Models\Channel::all();
            foreach ($channels as $channel) {
                $this->info("Importing videos for channel {$channel->id} ({$channel->name})...");
                \App\Jobs\ImportChannelVideos::dispatchSync($channel->id);
            }
        }

        $this->info('Import completed.');
    }
}
