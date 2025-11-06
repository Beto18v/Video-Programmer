<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\YoutubeCredential;
use App\Models\SheetCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

    public function redirectForSheets()
    {
        // Marcar en sesión que estamos autenticando sheets
        session(['auth_type' => 'sheets']);

        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/youtube.readonly',
                'https://www.googleapis.com/auth/youtube',
                'https://www.googleapis.com/auth/spreadsheets.readonly'
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    public function callback(Request $request)
    {
        $isSheetsAuth = session('auth_type') === 'sheets';

        // Limpiar la sesión
        session()->forget('auth_type');

        Log::info('Google Auth Callback', [
            'session_auth_type' => session('auth_type'),
            'isSheetsAuth' => $isSheetsAuth,
            'all_params' => $request->all()
        ]);

        try {
            $googleUser = Socialite::driver('google')->user();

            if ($isSheetsAuth) {
                // Para autenticación de sheets, guardar en SheetCredential
                $sheetCredential = SheetCredential::firstOrNew(['user_id' => Auth::id()]);
                $sheetCredential->access_token = $googleUser->token;
                if ($googleUser->refreshToken) {
                    $sheetCredential->refresh_token = $googleUser->refreshToken;
                }
                $sheetCredential->expires_at = now()->addSeconds($googleUser->expiresIn ?? 3600);
                $sheetCredential->token_metadata = array_merge($sheetCredential->token_metadata ?? [], [
                    'token_type' => $googleUser->tokenType,
                    'id_token' => $googleUser->idToken,
                    'fetched_at' => now()->toIso8601String(),
                    'scopes' => ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
                ]);
                $sheetCredential->save();

                // Para autenticación desde popup, devolver HTML que cierre el popup
                return response()->view('auth.google-sheets-callback', [
                    'message' => 'Cuenta de Google Sheets conectada correctamente.',
                    'redirectUrl' => route('video-schedules.index')
                ]);
            }

            // Lógica normal para autenticación de YouTube
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
                        $scopes = ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube'];
                        if ($isSheetsAuth) {
                            $scopes[] = 'https://www.googleapis.com/auth/spreadsheets.readonly';
                        }
                        YoutubeCredential::create([
                            'channel_id' => $existingChannel->id,
                            'access_token' => encrypt($googleUser->token),
                            'refresh_token' => encrypt($googleUser->refreshToken),
                            'expires_at' => now()->addSeconds($googleUser->expiresIn),
                            'scopes' => $scopes,
                            'status' => 'active',
                            'token_metadata' => [
                                'token_type' => $googleUser->tokenType,
                            ],
                        ]);
                    } else {
                        // Actualizar credenciales
                        $existingScopes = $existingChannel->youtubeCredentials->scopes ?? [];
                        if ($isSheetsAuth && !in_array('https://www.googleapis.com/auth/spreadsheets.readonly', $existingScopes)) {
                            $existingScopes[] = 'https://www.googleapis.com/auth/spreadsheets.readonly';
                        }
                        $existingChannel->youtubeCredentials->update([
                            'access_token' => encrypt($googleUser->token),
                            'refresh_token' => encrypt($googleUser->refreshToken),
                            'expires_at' => now()->addSeconds($googleUser->expiresIn),
                            'scopes' => $existingScopes,
                            'status' => 'active',
                            'last_refreshed_at' => now(),
                            'refresh_count' => $existingChannel->youtubeCredentials->refresh_count + 1,
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
            $scopes = ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube'];
            if ($isSheetsAuth) {
                $scopes[] = 'https://www.googleapis.com/auth/spreadsheets.readonly';
            }
            YoutubeCredential::create([
                'channel_id' => $channel->id,
                'access_token' => encrypt($googleUser->token),
                'refresh_token' => encrypt($googleUser->refreshToken),
                'expires_at' => now()->addSeconds($googleUser->expiresIn),
                'scopes' => $scopes,
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
