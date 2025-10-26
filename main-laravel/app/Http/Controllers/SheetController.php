<?php

namespace App\Http\Controllers;

use App\Models\SheetCredential;
use Google\Client;
use Google\Service\Sheets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SheetController extends Controller
{
    private const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
    private const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly';

    public function select(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $credential = $user->sheetCredential;

        if (!$credential) {
            return redirect()->route('sheets.auth.redirect');
        }

        return response()->json([
            'hasCredentials' => true,
            'expiresAt' => optional($credential->expires_at)?->toIso8601String(),
        ]);
    }

    public function checkCredentials(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'hasCredentials' => false,
                'message' => 'Usuario no autenticado.',
                'redirectUrl' => route('login'),
            ]);
        }

        $credential = $user->sheetCredential;

        if (!$credential) {
            return response()->json([
                'hasCredentials' => false,
                'message' => 'No tienes credenciales de Google Sheets. Conecta tu cuenta.',
                'redirectUrl' => route('sheets.auth.redirect'),
            ]);
        }

        try {
            $this->createAuthorizedClient($credential);
        } catch (\Throwable $th) {
            Log::warning('Failed to validate Google Sheets credentials', ['error' => $th->getMessage()]);

            return response()->json([
                'hasCredentials' => false,
                'message' => 'Tus credenciales de Google Sheets expiraron o no son válidas. Vuelve a conectarte.',
                'redirectUrl' => route('sheets.auth.redirect'),
            ]);
        }

        return response()->json([
            'hasCredentials' => true,
            'message' => 'Credenciales de Google Sheets listas para usar.',
        ]);
    }

    public function getSheetData(Request $request)
    {
        $validated = $request->validate([
            'spreadsheet_id' => 'nullable|string',
            'sheet_name' => 'nullable|string',
            'range' => 'nullable|string',
            'url' => 'nullable|url',
        ]);

        $spreadsheetId = $validated['spreadsheet_id'] ?? null;
        $sheetName = $validated['sheet_name'] ?? null;

        if (!$spreadsheetId && !empty($validated['url'])) {
            preg_match('/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $validated['url'], $matches);
            if ($matches) {
                $spreadsheetId = $matches[1];
            }
        }

        if (!$spreadsheetId) {
            return response()->json(['error' => 'Se requiere una URL o ID de Google Sheets válido.'], 422);
        }

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado.'], 401);
        }

        $credential = $user->sheetCredential;

        if (!$credential) {
            return response()->json([
                'error' => 'No tienes credenciales de Google Sheets guardadas. Autentícate primero.',
                'redirectUrl' => route('sheets.auth.redirect'),
            ], 401);
        }

        try {
            $client = $this->createAuthorizedClient($credential);
            $service = new Sheets($client);

            if (!$sheetName) {
                $spreadsheet = $service->spreadsheets->get($spreadsheetId, [
                    'fields' => 'sheets(properties(title))',
                ]);
                $firstSheet = $spreadsheet->getSheets()[0] ?? null;

                if (!$firstSheet) {
                    return response()->json(['error' => 'El archivo de Google Sheets no contiene hojas.'], 404);
                }

                $sheetName = $firstSheet->getProperties()->getTitle();
            }

            $range = $this->buildRange($sheetName, $validated['range'] ?? null);
            $response = $service->spreadsheets_values->get($spreadsheetId, $range);
            $values = $response->getValues() ?? [];

            if (empty($values)) {
                return response()->json(['error' => 'La hoja seleccionada no contiene datos.'], 400);
            }

            $columns = $this->transformValuesToColumns($values);

            return response()->json($columns);
        } catch (\Throwable $th) {
            Log::error('Error retrieving Google Sheet data', ['error' => $th->getMessage()]);

            return response()->json([
                'error' => 'Error al acceder al Google Sheet. Vuelve a intentarlo.',
            ], 500);
        }
    }

    private function createAuthorizedClient(SheetCredential $credential): Client
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

        if ($credential->isExpired()) {
            throw new \RuntimeException('El token de Google Sheets está expirado.');
        }

        return $client;
    }

    private function buildRange(string $sheetName, ?string $range): string
    {
        if ($range) {
            return str_contains($range, '!')
                ? $range
                : sprintf("'%s'!%s", $this->escapeSheetName($sheetName), $range);
        }

        return sprintf("'%s'!A1:ZZZ", $this->escapeSheetName($sheetName));
    }

    private function transformValuesToColumns(array $values): array
    {
        $maxColumns = 0;
        foreach ($values as $row) {
            $maxColumns = max($maxColumns, count($row));
        }

        if ($maxColumns === 0) {
            return [];
        }

        $headers = array_pad($values[0] ?? [], $maxColumns, null);
        $dataRows = array_map(fn($row) => array_pad($row, $maxColumns, null), array_slice($values, 1));

        $columns = [];
        for ($index = 0; $index < $maxColumns; $index++) {
            $columnId = $this->columnLetterFromIndex($index);
            $header = $headers[$index];
            $columnName = $header && trim((string) $header) !== '' ? $header : 'Columna ' . $columnId;
            $columnData = array_map(fn($row) => $row[$index], $dataRows);

            $columns[] = [
                'id' => $columnId,
                'name' => $columnName,
                'data' => $columnData,
            ];
        }

        return $columns;
    }

    private function columnLetterFromIndex(int $index): string
    {
        $index += 1;
        $column = '';

        while ($index > 0) {
            $remainder = ($index - 1) % 26;
            $column = chr(65 + $remainder) . $column;
            $index = intdiv($index - 1, 26);
        }

        return $column;
    }

    private function escapeSheetName(string $sheetName): string
    {
        return str_replace("'", "''", $sheetName);
    }
}
