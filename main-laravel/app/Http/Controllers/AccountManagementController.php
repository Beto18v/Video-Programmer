<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountManagementController extends Controller
{
    public function index(Request $request)
    {
        $usersQuery = User::with('currentPlan');

        if ($request->filled('email')) {
            $usersQuery->where('email', 'like', '%' . $request->email . '%');
        }

        if ($request->filled('plan')) {
            $usersQuery->whereHas('currentPlan', function ($q) use ($request) {
                $q->where('name', $request->plan);
            });
        }

        $users = $usersQuery->get();
        $channels = Channel::with('user')->get();
        $videos = Video::with('channel')->get();

        return Inertia::render('dashboard/account-management/index', [
            'users' => $users,
            'channels' => $channels,
            'videos' => $videos,
            'filters' => $request->only(['email', 'plan']),
        ]);
    }
}
