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
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('channel_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable(); // Ruta del archivo de video
            $table->string('thumbnail_path')->nullable(); // Ruta de la miniatura
            $table->string('thumbnail_url')->nullable(); // URL de la miniatura (si es externa)
            $table->enum('status', ['draft', 'pending', 'uploading', 'uploaded', 'published', 'failed', 'deleted'])->default('draft');
            $table->string('youtube_video_id')->nullable()->unique(); // ID del video en YouTube
            $table->enum('privacy', ['private', 'unlisted', 'public'])->default('private');
            $table->json('tags')->nullable(); // Etiquetas del video
            $table->string('category_id', 10)->nullable(); // ID de categoría de YouTube
            $table->string('language', 10)->default('en'); // Idioma del video
            $table->boolean('made_for_kids')->default(false);
            $table->timestamp('scheduled_for')->nullable(); // Fecha programada de publicación
            $table->timestamp('published_at')->nullable(); // Fecha real de publicación
            $table->text('upload_error')->nullable(); // Error durante la subida
            $table->json('video_metadata')->nullable(); // Metadatos adicionales
            $table->unsignedBigInteger('file_size')->nullable(); // Tamaño del archivo en bytes
            $table->string('duration')->nullable(); // Duración del video (formato HH:MM:SS)
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('like_count')->default(0);
            $table->unsignedBigInteger('comment_count')->default(0);
            $table->timestamps();

            // Índices para mejorar rendimiento
            $table->index('user_id');
            $table->index('channel_id');
            $table->index('status');
            $table->index('scheduled_for');
            $table->index('published_at');
            $table->index(['user_id', 'status']);
            $table->index(['channel_id', 'status']);
            $table->index(['scheduled_for', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
