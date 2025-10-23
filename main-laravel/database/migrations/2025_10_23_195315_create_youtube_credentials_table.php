<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('youtube_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')->constrained()->onDelete('cascade');
            $table->text('access_token'); // Encriptado
            $table->text('refresh_token'); // Encriptado
            $table->timestamp('expires_at');
            $table->json('scopes'); // Permisos otorgados
            $table->enum('status', ['active', 'expired', 'revoked', 'invalid'])->default('active');
            $table->timestamp('last_refreshed_at')->nullable();
            $table->integer('refresh_count')->default(0);
            $table->json('token_metadata')->nullable(); // Metadatos adicionales del token
            $table->timestamps();

            // Índices
            $table->index('channel_id');
            $table->index('status');
            $table->index('expires_at');
            $table->index(['channel_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('youtube_credentials');
    }
};
