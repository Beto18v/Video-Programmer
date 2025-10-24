<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\YoutubeCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Google\Client;
use Google\Service\YouTube;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')
            ->scopes(['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube'])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Crear cliente de Google API
            $client = new Client();
            $client->setAccessToken($googleUser->token);

            // Obtener información del canal
            $youtube = new YouTube($client);
            $channelsResponse = $youtube->channels->listChannels('snippet,statistics', [
                'mine' => true,
            ]);

            if (empty($channelsResponse->items)) {
                return redirect('/channels')->with('error', 'No se pudo encontrar un canal de YouTube asociado a esta cuenta.');
            }

            $youtubeChannel = $channelsResponse->items[0];

            // Verificar si el canal ya existe (incluyendo soft deleted)
            $existingChannel = Channel::withTrashed()->where('youtube_channel_id', $youtubeChannel->id)->first();

            if ($existingChannel) {
                if ($existingChannel->trashed()) {
                    // Restaurar el canal eliminado
                    $existingChannel->restore();
                    // Actualizar datos
                    $existingChannel->update([
                        'user_id' => Auth::id(),
                        'name' => $youtubeChannel->snippet->title,
                        'description' => $youtubeChannel->snippet->description,
                        'custom_url' => $youtubeChannel->snippet->customUrl ?? null,
                        'avatar_url' => $youtubeChannel->snippet->thumbnails->default->url ?? null,
                        'banner_url' => $youtubeChannel->snippet->thumbnails->high->url ?? null,
                        'subscriber_count' => $youtubeChannel->statistics->subscriberCount ?? 0,
                        'video_count' => $youtubeChannel->statistics->videoCount ?? 0,
                        'view_count' => $youtubeChannel->statistics->viewCount ?? 0,
                        'status' => 'active',
                        'connected_at' => now(),
                        'channel_metadata' => [
                            'country' => $youtubeChannel->snippet->country ?? null,
                            'published_at' => $youtubeChannel->snippet->publishedAt,
                        ],
                    ]);

                    // Verificar si ya tiene credenciales, si no, crear
                    if (!$existingChannel->youtubeCredentials) {
                        YoutubeCredential::create([
                            'channel_id' => $existingChannel->id,
                            'access_token' => $googleUser->token,
                            'refresh_token' => $googleUser->refreshToken,
                            'expires_at' => now()->addSeconds($googleUser->expiresIn),
                            'scopes' => ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube'],
                            'status' => 'active',
                            'token_metadata' => [
                                'token_type' => $googleUser->tokenType,
                            ],
                        ]);
                    } else {
                        // Actualizar credenciales
                        $existingChannel->youtubeCredentials->update([
                            'access_token' => $googleUser->token,
                            'refresh_token' => $googleUser->refreshToken,
                            'expires_at' => now()->addSeconds($googleUser->expiresIn),
                            'status' => 'active',
                        ]);
                    }

                    return redirect('/channels')->with('success', 'Canal de YouTube restaurado y conectado exitosamente.');
                } else {
                    return redirect('/channels')->with('error', 'Este canal de YouTube ya está conectado.');
                }
            }

            // Crear el canal
            $channel = Channel::create([
                'user_id' => Auth::id(),
                'youtube_channel_id' => $youtubeChannel->id,
                'name' => $youtubeChannel->snippet->title,
                'description' => $youtubeChannel->snippet->description,
                'custom_url' => $youtubeChannel->snippet->customUrl ?? null,
                'avatar_url' => $youtubeChannel->snippet->thumbnails->default->url ?? null,
                'banner_url' => $youtubeChannel->snippet->thumbnails->high->url ?? null,
                'subscriber_count' => $youtubeChannel->statistics->subscriberCount ?? 0,
                'video_count' => $youtubeChannel->statistics->videoCount ?? 0,
                'view_count' => $youtubeChannel->statistics->viewCount ?? 0,
                'status' => 'active',
                'connected_at' => now(),
                'channel_metadata' => [
                    'country' => $youtubeChannel->snippet->country ?? null,
                    'published_at' => $youtubeChannel->snippet->publishedAt,
                ],
            ]);

            // Crear las credenciales
            YoutubeCredential::create([
                'channel_id' => $channel->id,
                'access_token' => $googleUser->token,
                'refresh_token' => $googleUser->refreshToken,
                'expires_at' => now()->addSeconds($googleUser->expiresIn),
                'scopes' => ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube'],
                'status' => 'active',
                'token_metadata' => [
                    'token_type' => $googleUser->tokenType,
                ],
            ]);

            return redirect('/channels')->with('success', 'Canal de YouTube conectado exitosamente.');
        } catch (\Exception $e) {
            return redirect('/channels')->with('error', 'Error al conectar el canal: ' . $e->getMessage());
        }
    }
}
