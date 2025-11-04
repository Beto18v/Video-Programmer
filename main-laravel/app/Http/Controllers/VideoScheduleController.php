<?php

namespace App\Http\Controllers;

use App\Models\VideoSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VideoScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $videoSchedules = VideoSchedule::with('video')
            ->whereHas('video', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->get();

        // Check if this is an API request
        if ($request->expectsJson()) {
            return response()->json([
                'videoSchedules' => $videoSchedules
            ]);
        }

        $channels = auth()->user()->channels()->get()->map(function ($channel) {
            $channel->platform = 'youtube';
            return $channel;
        });

        return Inertia::render('dashboard/videoSchedules/index', [
            'videoSchedules' => $videoSchedules,
            'channels' => $channels,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('dashboard/videoSchedules/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Create the video first
        $video = \App\Models\Video::create([
            'user_id' => auth()->id(),
            'title' => $request->title,
            'description' => $request->description,
            'tags' => $request->tags ?? [],
            'made_for_kids' => $request->made_for_kids ?? false,
            'privacy' => ($request->privacy ?? 'public'),
            'scheduled_for' => $request->scheduled_for,
            'status' => $request->status ?? 'pending',
        ]);

        // Create the video schedule
        $videoSchedule = VideoSchedule::create([
            'video_id' => $video->id,
            'scheduled_at' => $request->scheduled_for,
            'status' => $request->status ?? 'pending',
            'action' => 'upload',
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'videoSchedule' => $videoSchedule->load('video'),
                'id' => $videoSchedule->id
            ], 201);
        }

        return redirect()->route('video-schedules.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(VideoSchedule $videoSchedule)
    {
        return Inertia::render('dashboard/videoSchedules/show', [
            'videoSchedule' => $videoSchedule->load('video'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VideoSchedule $videoSchedule)
    {
        return Inertia::render('dashboard/videoSchedules/edit', [
            'videoSchedule' => $videoSchedule->load('video'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VideoSchedule $videoSchedule)
    {
        // Update the associated video
        if ($videoSchedule->video) {
            $videoSchedule->video->update([
                'title' => $request->title,
                'description' => $request->description,
                'tags' => $request->tags ?? [],
                'made_for_kids' => $request->made_for_kids ?? false,
                'privacy' => ($request->privacy ?? 'public'),
                'scheduled_for' => $request->scheduled_for,
                'status' => $request->status ?? 'pending',
            ]);
        }

        // Update the video schedule
        $videoSchedule->update([
            'scheduled_at' => $request->scheduled_for,
            'status' => $request->status ?? 'pending',
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'videoSchedule' => $videoSchedule->load('video')
            ]);
        }

        return redirect()->route('video-schedules.show', $videoSchedule);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, VideoSchedule $videoSchedule)
    {
        // Delete the associated video first
        if ($videoSchedule->video) {
            $videoSchedule->video->delete();
        }

        $videoSchedule->delete();

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Video schedule deleted successfully']);
        }

        return redirect()->route('video-schedules.index');
    }
}
