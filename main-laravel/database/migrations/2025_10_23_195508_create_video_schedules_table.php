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
        Schema::create('video_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained()->onDelete('cascade');
            $table->timestamp('scheduled_at'); // Fecha y hora programada
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->enum('action', ['upload', 'publish', 'update_privacy'])->default('upload');
            $table->json('action_parameters')->nullable(); // Parámetros específicos de la acción
            $table->timestamp('executed_at')->nullable(); // Cuándo se ejecutó realmente
            $table->text('error_message')->nullable(); // Mensaje de error si falla
            $table->json('execution_log')->nullable(); // Log detallado de la ejecución
            $table->integer('retry_count')->default(0);
            $table->integer('max_retries')->default(3);
            $table->timestamp('next_retry_at')->nullable();
            $table->timestamps();

            // Índices para mejorar rendimiento
            $table->index('video_id');
            $table->index('scheduled_at');
            $table->index('status');
            $table->index('next_retry_at');
            $table->index(['status', 'scheduled_at']);
            $table->index(['status', 'next_retry_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_schedules');
    }
};
