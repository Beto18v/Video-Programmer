<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\YoutubeCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class YoutubeStatusController extends Controller
{
    public function status()
    {
        $user = Auth::user();
        $channels = Channel::where('user_id', $user->id)
            ->with('youtubeCredential')
            ->get();

        $statistics = [
            'total_channels' => $channels->count(),
            'connected_channels' => $channels->whereNotNull('youtubeCredential')->count(),
            'active_tokens' => $channels->filter(function ($channel) {
                return $channel->youtubeCredential &&
                    $channel->youtubeCredential->status === 'active' &&
                    $channel->youtubeCredential->expires_at > now();
            })->count(),
            'expired_tokens' => $channels->filter(function ($channel) {
                return $channel->youtubeCredential &&
                    ($channel->youtubeCredential->status === 'expired' ||
                        $channel->youtubeCredential->expires_at <= now());
            })->count(),
        ];

        $needsReauth = $statistics['expired_tokens'] > 0 || $statistics['active_tokens'] === 0;

        return Inertia::render('dashboard/youtube-status/index', [
            'channels' => $channels,
            'statistics' => $statistics,
            'needsReauth' => $needsReauth,
            'authUrl' => route('auth.google'),
        ]);
    }
}
