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
        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('youtube_channel_id')->unique(); // ID del canal en YouTube
            $table->string('name'); // Nombre del canal
            $table->string('custom_url')->nullable(); // URL personalizada del canal
            $table->text('description')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('banner_url')->nullable();
            $table->unsignedBigInteger('subscriber_count')->default(0);
            $table->unsignedBigInteger('video_count')->default(0);
            $table->unsignedBigInteger('view_count')->default(0);
            $table->enum('status', ['active', 'inactive', 'suspended', 'error'])->default('active');
            $table->timestamp('connected_at');
            $table->timestamp('last_sync_at')->nullable();
            $table->json('channel_metadata')->nullable(); // Metadatos adicionales del canal
            $table->timestamps();

            // Índices para mejorar rendimiento
            $table->index('user_id');
            $table->index('status');
            $table->index('connected_at');
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channels');
    }
};
