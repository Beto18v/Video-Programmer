<?php

namespace App\Console\Commands;

use App\Models\YoutubeCredential;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FixYoutubeCredentials extends Command
{
    protected $signature = 'youtube:fix-credentials';
    protected $description = 'Fix and re-encrypt YouTube credentials that were stored incorrectly';

    public function handle()
    {
        $this->info('🔧 Fixing YouTube credentials...');
        $this->newLine();

        $credentials = YoutubeCredential::all();
        $fixed = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($credentials as $credential) {
            $this->info("Processing credential ID: {$credential->id}");

            try {
                // Try to decrypt the tokens - if they fail, they're probably not encrypted
                $decryptedAccessToken = null;
                $decryptedRefreshToken = null;

                try {
                    $decryptedAccessToken = decrypt($credential->access_token);
                    $decryptedRefreshToken = decrypt($credential->refresh_token);

                    // If we can decrypt, they're already properly encrypted
                    $this->info("  ✅ Already properly encrypted");
                    $skipped++;
                    continue;
                } catch (\Exception $e) {
                    // If decryption fails, they're probably stored as plain text
                    $this->warn("  🔄 Tokens appear to be unencrypted, fixing...");

                    // Try to use them as plain text and re-encrypt
                    $plainAccessToken = $credential->access_token;
                    $plainRefreshToken = $credential->refresh_token;

                    // Validate that they look like tokens (basic check)
                    if (strlen($plainAccessToken) < 10 || strlen($plainRefreshToken) < 10) {
                        throw new \Exception("Tokens appear to be invalid or corrupted");
                    }

                    // Re-encrypt and save
                    $credential->update([
                        'access_token' => encrypt($plainAccessToken),
                        'refresh_token' => encrypt($plainRefreshToken),
                        'status' => 'expired', // Mark as expired so they need to re-auth
                    ]);

                    $this->info("  ✅ Fixed and re-encrypted");
                    $fixed++;
                }
            } catch (\Exception $e) {
                $this->error("  ❌ Error fixing credential: " . $e->getMessage());

                // Mark as invalid so user knows to re-authenticate
                $credential->update(['status' => 'invalid']);
                $errors++;
            }
        }

        $this->newLine();
        $this->info("🏁 Fix completed!");
        $this->info("✅ Fixed and re-encrypted: {$fixed}");
        $this->info("⏩ Already properly encrypted: {$skipped}");

        if ($errors > 0) {
            $this->warn("❌ Errors (marked as invalid): {$errors}");
            $this->info("💡 Users with invalid credentials should re-authenticate at: " . route('auth.google'));
        }

        if ($fixed > 0 || $errors > 0) {
            $this->newLine();
            $this->info("🔄 All fixed credentials have been marked as expired for security.");
            $this->info("Users should re-authenticate to get fresh tokens.");
        }

        return 0;
    }
}
