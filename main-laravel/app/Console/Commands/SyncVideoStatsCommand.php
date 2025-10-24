<?php

namespace App\Console\Commands;

use App\Jobs\SyncVideoStats;
use Illuminate\Console\Command;

class SyncVideoStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'videos:sync-stats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync video statistics from YouTube API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Dispatching sync video stats job...');
        SyncVideoStats::dispatch();
        $this->info('Job dispatched successfully.');
    }
}
