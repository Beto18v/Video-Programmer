<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VideoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Video::with('channel')
            ->whereHas('channel', function ($query) {
                $query->where('user_id', auth()->id());
            });

        // Filter by channel if provided
        if ($request->has('channel_id') && $request->channel_id) {
            $query->where('channel_id', $request->channel_id);
        }

        $videos = $query->orderBy('published_at', 'desc')->get();

        // Get user's channels for filter
        $channels = Channel::where('user_id', auth()->id())->get();

        return Inertia::render('dashboard/videos/index', [
            'videos' => $videos,
            'channels' => $channels,
            'filters' => $request->only(['channel_id']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('dashboard/videos/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $video = Video::create($request->all());
        return redirect()->route('videos.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Video $video)
    {
        return Inertia::render('dashboard/videos/show', [
            'video' => $video,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Video $video)
    {
        return Inertia::render('dashboard/videos/edit', [
            'video' => $video,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Video $video)
    {
        $video->update($request->all());
        return redirect()->route('videos.show', $video);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Video $video)
    {
        $video->delete();
        return redirect()->route('videos.index');
    }
}
