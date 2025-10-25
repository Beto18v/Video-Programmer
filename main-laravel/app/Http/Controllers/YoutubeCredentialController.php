<?php

namespace App\Http\Controllers;

use App\Models\YoutubeCredential;
use Illuminate\Http\Request;
use Inertia\Inertia;

class YoutubeCredentialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $youtubeCredentials = YoutubeCredential::with('channel')
            ->whereHas('channel', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->get();
        return Inertia::render('dashboard/youtubeCredentials/index', [
            'youtubeCredentials' => $youtubeCredentials,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('dashboard/youtubeCredentials/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $youtubeCredential = YoutubeCredential::create($request->all());

        // Import videos automatically when connecting a channel
        if ($youtubeCredential->channel_id) {
            \App\Jobs\ImportChannelVideos::dispatchSync($youtubeCredential->channel_id);
        }

        return redirect()->route('youtube-credentials.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(YoutubeCredential $youtubeCredential)
    {
        return Inertia::render('dashboard/youtubeCredentials/show', [
            'youtubeCredential' => $youtubeCredential->load('channel'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(YoutubeCredential $youtubeCredential)
    {
        return Inertia::render('dashboard/youtubeCredentials/edit', [
            'youtubeCredential' => $youtubeCredential->load('channel'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, YoutubeCredential $youtubeCredential)
    {
        $youtubeCredential->update($request->all());
        return redirect()->route('youtube-credentials.show', $youtubeCredential);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(YoutubeCredential $youtubeCredential)
    {
        $youtubeCredential->delete();
        return redirect()->route('youtube-credentials.index');
    }
}
