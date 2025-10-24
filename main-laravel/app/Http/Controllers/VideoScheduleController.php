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
    public function index()
    {
        $videoSchedules = VideoSchedule::all();
        return Inertia::render('dashboard/videoSchedules/index', [
            'videoSchedules' => $videoSchedules,
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
        $videoSchedule = VideoSchedule::create($request->all());
        return redirect()->route('video-schedules.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(VideoSchedule $videoSchedule)
    {
        return Inertia::render('dashboard/videoSchedules/show', [
            'videoSchedule' => $videoSchedule,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VideoSchedule $videoSchedule)
    {
        return Inertia::render('dashboard/videoSchedules/edit', [
            'videoSchedule' => $videoSchedule,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VideoSchedule $videoSchedule)
    {
        $videoSchedule->update($request->all());
        return redirect()->route('video-schedules.show', $videoSchedule);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VideoSchedule $videoSchedule)
    {
        $videoSchedule->delete();
        return redirect()->route('video-schedules.index');
    }
}
