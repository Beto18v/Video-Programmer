<?php

namespace App\Http\Controllers;

use App\Models\YoutubeCredential;
use Illuminate\Http\Request;

class YoutubeCredentialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $youtubeCredentials = YoutubeCredential::all();
        return response()->json($youtubeCredentials);
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
        $youtubeCredential = YoutubeCredential::create($request->all());
        return response()->json($youtubeCredential, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(YoutubeCredential $youtubeCredential)
    {
        return response()->json($youtubeCredential);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(YoutubeCredential $youtubeCredential)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, YoutubeCredential $youtubeCredential)
    {
        $youtubeCredential->update($request->all());
        return response()->json($youtubeCredential);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(YoutubeCredential $youtubeCredential)
    {
        $youtubeCredential->delete();
        return response()->json(null, 204);
    }
}
