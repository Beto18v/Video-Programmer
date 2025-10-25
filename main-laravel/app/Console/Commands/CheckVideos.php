<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-videos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking videos...');

        $totalVideos = \App\Models\Video::count();
        $this->info("Total videos: $totalVideos");

        $totalChannels = \App\Models\Channel::count();
        $this->info("Total channels: $totalChannels");

        $users = \App\Models\User::all();
        foreach ($users as $user) {
            $userChannels = \App\Models\Channel::where('user_id', $user->id)->count();
            $userVideos = \App\Models\Video::whereHas('channel', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count();
            $this->info("User {$user->email}: $userChannels channels, $userVideos videos");
        }
    }
}
