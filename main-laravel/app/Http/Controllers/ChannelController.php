<?php

namespace App\Http\Controllers;

use App\Jobs\ImportChannelVideos;
use App\Jobs\SyncChannelStats;
use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ChannelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $channels = Channel::where('user_id', auth()->id())->get();
        return Inertia::render('dashboard/channels/index', [
            'channels' => $channels,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('dashboard/channels/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $channel = Channel::create($request->all());
        $channel->importing = true;
        $channel->save();

        // Despachar el job para importar videos automáticamente
        ImportChannelVideos::dispatchSync($channel->id);

        return redirect()->route('channels.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Channel $channel)
    {
        return Inertia::render('dashboard/channels/show', [
            'channel' => $channel,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Channel $channel)
    {
        return Inertia::render('dashboard/channels/edit', [
            'channel' => $channel,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Channel $channel)
    {
        $channel->update($request->all());
        return redirect()->route('channels.show', $channel);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Channel $channel)
    {
        $channel->importing = false;
        $channel->save();
        $channel->delete();
        return redirect()->route('channels.index')->with('success', 'Canal desconectado exitosamente.');
    }

    public function restore(Channel $channel)
    {
        $channel->restore();
        return redirect()->route('account-management.index')->with('success', 'Canal restaurado exitosamente.');
    }

    /**
     * Sync channel statistics from YouTube API
     */
    public function sync(Channel $channel)
    {
        try {
            // Dispatch the sync job synchronously to get immediate results
            SyncChannelStats::dispatchSync($channel->id);
            
            // Reload the channel to get updated data
            $channel->refresh();
            
            return response()->json([
                'success' => true,
                'message' => 'Estadísticas del canal actualizadas exitosamente',
                'channel' => $channel
            ]);
        } catch (\Exception $e) {
            Log::error("Error syncing channel {$channel->id}: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar las estadísticas del canal'
            ], 500);
        }
    }

    /**
     * Sync all channels for the authenticated user
     */
    public function syncAll()
    {
        try {
            $channels = Channel::where('user_id', auth()->id())
                ->where('status', 'active')
                ->get();
            
            foreach ($channels as $channel) {
                SyncChannelStats::dispatch($channel->id);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Sincronización iniciada para todos los canales',
                'channels_count' => $channels->count()
            ]);
        } catch (\Exception $e) {
            Log::error("Error syncing all channels: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al sincronizar los canales'
            ], 500);
        }
    }
}
