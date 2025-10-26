<?php

namespace App\Http\Controllers;

use App\Models\SheetCredential;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleSheetsAuthController extends Controller
{
    public const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
    public const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly';

    public function redirect()
    {
        return Socialite::driver('google')
            ->scopes([self::SHEETS_SCOPE, self::DRIVE_SCOPE])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    public function callback(Request $request)
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $th) {
            Log::warning('Google Sheets auth callback failed', ['error' => $th->getMessage()]);

            return redirect()
                ->route('sheets.select')
                ->with('error', 'No se pudo completar la autenticación con Google. Inténtalo de nuevo.');
        }

        $user = Auth::user();
        $credential = SheetCredential::firstOrNew(['user_id' => $user->id]);
        $credential->access_token = $googleUser->token;
        if ($googleUser->refreshToken) {
            $credential->refresh_token = $googleUser->refreshToken;
        }
        $credential->expires_at = now()->addSeconds($googleUser->expiresIn ?? 3600);
        $credential->token_metadata = array_merge($credential->token_metadata ?? [], [
            'token_type' => $googleUser->tokenType,
            'id_token' => $googleUser->idToken,
            'fetched_at' => now()->toIso8601String(),
            'scopes' => [self::SHEETS_SCOPE, self::DRIVE_SCOPE],
        ]);
        $credential->save();

        return redirect()
            ->route('sheets.select')
            ->with('success', 'Cuenta de Google Sheets conectada correctamente.');
    }

    public function listSheets(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $credential = $user->sheetCredential;
        if (!$credential) {
            return response()->json([
                'message' => 'No tienes credenciales de Google Sheets guardadas.',
                'redirectUrl' => route('sheets.auth.redirect'),
            ], 404);
        }

        try {
            $client = $this->buildAuthorizedClient($credential);
            $drive = new Drive($client);
            $pageSize = (int) $request->query('page_size', 50);
            $pageSize = max(1, min(100, $pageSize));

            $response = $drive->files->listFiles([
                'q' => "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
                'fields' => 'files(id,name,modifiedTime,owners(emailAddress,displayName),webViewLink,iconLink),nextPageToken',
                'orderBy' => 'modifiedTime desc',
                'pageSize' => $pageSize,
                'pageToken' => $request->query('pageToken') ?: null,
                'spaces' => 'drive',
            ]);

            $files = collect($response->getFiles())->map(function ($file) {
                $owners = $file->getOwners();
                $owner = $owners ? $owners[0] : null;

                return [
                    'id' => $file->getId(),
                    'name' => $file->getName(),
                    'modified_time' => $file->getModifiedTime(),
                    'owner' => $owner ? $owner->getEmailAddress() : null,
                    'web_view_link' => $file->getWebViewLink(),
                    'icon_link' => $file->getIconLink(),
                ];
            });

            return response()->json([
                'files' => $files,
                'next_page_token' => $response->getNextPageToken(),
            ]);
        } catch (\Throwable $th) {
            Log::error('Error listing Google Sheets files', ['error' => $th->getMessage()]);

            return response()->json([
                'message' => 'Error al listar los archivos de Google Sheets.',
            ], 500);
        }
    }

    public function listTabs(Request $request)
    {
        $validated = $request->validate([
            'spreadsheet_id' => 'required|string',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $credential = $user->sheetCredential;
        if (!$credential) {
            return response()->json([
                'message' => 'No tienes credenciales de Google Sheets guardadas.',
                'redirectUrl' => route('sheets.auth.redirect'),
            ], 404);
        }

        try {
            $client = $this->buildAuthorizedClient($credential);
            $sheetsService = new Sheets($client);
            $spreadsheet = $sheetsService->spreadsheets->get($validated['spreadsheet_id'], [
                'fields' => 'sheets(properties(sheetId,title,index,gridProperties(rowCount,columnCount)))',
            ]);

            $tabs = collect($spreadsheet->getSheets())->map(function ($sheet) {
                $properties = $sheet->getProperties();
                $grid = $properties->getGridProperties();

                return [
                    'sheet_id' => $properties->getSheetId(),
                    'title' => $properties->getTitle(),
                    'index' => $properties->getIndex(),
                    'row_count' => $grid ? $grid->getRowCount() : null,
                    'column_count' => $grid ? $grid->getColumnCount() : null,
                ];
            });

            return response()->json([
                'tabs' => $tabs,
            ]);
        } catch (\Throwable $th) {
            Log::error('Error listing Google Sheets tabs', ['error' => $th->getMessage()]);

            return response()->json([
                'message' => 'Error al listar las hojas del archivo de Google Sheets.',
            ], 500);
        }
    }

    public function previewTab(Request $request)
    {
        $validated = $request->validate([
            'spreadsheet_id' => 'required|string',
            'sheet_name' => 'required|string',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $credential = $user->sheetCredential;
        if (!$credential) {
            return response()->json([
                'message' => 'No tienes credenciales de Google Sheets guardadas.',
                'redirectUrl' => route('sheets.auth.redirect'),
            ], 404);
        }

        $limit = $validated['limit'] ?? 100;
        $limit = max(1, min(500, $limit));

        try {
            $client = $this->buildAuthorizedClient($credential);
            $sheetsService = new Sheets($client);
            $range = sprintf("'%s'!A1:%s%d", $this->escapeSheetName($validated['sheet_name']), 'ZZZ', $limit);
            $response = $sheetsService->spreadsheets_values->get($validated['spreadsheet_id'], $range);
            $values = $response->getValues() ?? [];

            $headers = $values[0] ?? [];
            $rows = array_slice($values, 1);

            return response()->json([
                'headers' => $headers,
                'rows' => $rows,
            ]);
        } catch (\Throwable $th) {
            Log::error('Error previewing Google Sheet tab', ['error' => $th->getMessage()]);

            return response()->json([
                'message' => 'Error al obtener la vista previa de la hoja seleccionada.',
            ], 500);
        }
    }

    private function buildAuthorizedClient(SheetCredential $credential): Client
    {
        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessType('offline');
        $client->setScopes([self::SHEETS_SCOPE, self::DRIVE_SCOPE]);
        $client->setAccessToken($credential->access_token);

        if (($credential->needsRefresh() || $credential->isExpired()) && $credential->refresh_token) {
            $token = $client->fetchAccessTokenWithRefreshToken($credential->refresh_token);

            if (isset($token['error'])) {
                $details = $token['error_description'] ?? $token['error'];
                throw new \RuntimeException('No se pudo refrescar el token de Google Sheets: ' . $details);
            }

            if (empty($token['access_token'])) {
                throw new \RuntimeException('No se pudo refrescar el token de Google Sheets.');
            }

            $credential->forceFill([
                'access_token' => $token['access_token'],
                'expires_at' => now()->addSeconds($token['expires_in'] ?? 3600),
                'token_metadata' => array_merge($credential->token_metadata ?? [], [
                    'refreshed_at' => now()->toIso8601String(),
                ]),
            ])->save();

            $client->setAccessToken($token['access_token']);
        }

        return $client;
    }

    private function escapeSheetName(string $sheetName): string
    {
        return str_replace("'", "''", $sheetName);
    }
}
