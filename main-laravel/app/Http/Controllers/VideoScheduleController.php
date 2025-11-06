<?php

namespace App\Http\Controllers;

use App\Models\VideoSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class VideoScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $videoSchedules = VideoSchedule::with(['video.channel'])
            ->whereHas('video', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->orderBy('created_at', 'desc')
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
        $request->validate([
            'title' => 'required|string|max:100|min:3',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'scheduled_for' => 'required|date|after:now',
            'made_for_kids' => 'boolean',
            'privacy' => 'string|in:public,private,unlisted',
            'channel_id' => 'nullable|exists:channels,id',
        ]);

        // Create the video first
        $video = \App\Models\Video::create([
            'user_id' => auth()->id(),
            'channel_id' => $request->channel_id,
            'title' => $request->title,
            'description' => $request->description ?? '',
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
        $request->validate([
            'title' => 'required|string|max:100|min:3',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'scheduled_for' => 'required|date|after:now',
            'made_for_kids' => 'boolean',
            'privacy' => 'string|in:public,private,unlisted',
            'channel_id' => 'nullable|exists:channels,id',
        ]);

        // Update the associated video
        if ($videoSchedule->video) {
            $videoSchedule->video->update([
                'channel_id' => $request->channel_id,
                'title' => $request->title,
                'description' => $request->description ?? '',
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
        // Verify user owns the video schedule
        if ($videoSchedule->video && $videoSchedule->video->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Delete the associated video first
        if ($videoSchedule->video) {
            // Delete video files if they exist
            if ($videoSchedule->video->file_path) {
                Storage::disk('public')->delete($videoSchedule->video->file_path);
            }
            if ($videoSchedule->video->thumbnail_path) {
                Storage::disk('public')->delete($videoSchedule->video->thumbnail_path);
            }

            $videoSchedule->video->delete();
        }

        $videoSchedule->delete();

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Video schedule deleted successfully']);
        }

        return redirect()->route('video-schedules.index')
            ->with('success', 'Programación eliminada correctamente');
    }

    /**
     * Upload video file for a specific video schedule
     */
    public function uploadFile(Request $request, VideoSchedule $videoSchedule)
    {
        $request->validate([
            'video_file' => 'required|file|mimes:mp4,avi,mov,wmv,flv,webm,mkv|max:10240000', // 10GB max
            'thumbnail' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:10240', // 10MB max
        ]);

        $uploadPath = 'videos/' . auth()->id();

        if ($request->hasFile('video_file')) {
            $videoPath = $request->file('video_file')->store($uploadPath, 'public');

            if ($videoSchedule->video) {
                $videoSchedule->video->update([
                    'file_path' => $videoPath,
                    'file_size' => $request->file('video_file')->getSize(),
                    'duration' => null, // This could be extracted using FFmpeg
                ]);
            }
        }

        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store($uploadPath . '/thumbnails', 'public');

            if ($videoSchedule->video) {
                $videoSchedule->video->update([
                    'thumbnail_path' => $thumbnailPath,
                ]);
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Files uploaded successfully',
                'videoSchedule' => $videoSchedule->load('video')
            ]);
        }

        return redirect()->route('video-schedules.show', $videoSchedule)
            ->with('success', 'Archivos subidos correctamente');
    }
}
