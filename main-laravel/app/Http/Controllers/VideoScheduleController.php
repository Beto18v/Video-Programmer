<?php

namespace App\Http\Controllers;

use App\Models\VideoSchedule;
use Illuminate\Http\Request;

class VideoScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $videoSchedules = VideoSchedule::all();
        return response()->json($videoSchedules);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $videoSchedule = VideoSchedule::create($request->all());
        return response()->json($videoSchedule, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(VideoSchedule $videoSchedule)
    {
        return response()->json($videoSchedule);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VideoSchedule $videoSchedule)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VideoSchedule $videoSchedule)
    {
        $videoSchedule->update($request->all());
        return response()->json($videoSchedule);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VideoSchedule $videoSchedule)
    {
        $videoSchedule->delete();
        return response()->json(null, 204);
    }
}
