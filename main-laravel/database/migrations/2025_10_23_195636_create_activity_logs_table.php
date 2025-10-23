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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // Acción realizada (e.g., 'channel_connected', 'video_uploaded', 'plan_changed')
            $table->string('entity_type')->nullable(); // Tipo de entidad (Channel, Video, Subscription, etc.)
            $table->unsignedBigInteger('entity_id')->nullable(); // ID de la entidad
            $table->text('description'); // Descripción legible de la acción
            $table->json('metadata')->nullable(); // Datos adicionales de la acción
            $table->json('changes')->nullable(); // Cambios realizados (before/after)
            $table->string('ip_address', 45)->nullable(); // IP del usuario
            $table->text('user_agent')->nullable(); // User agent del navegador
            $table->enum('level', ['info', 'warning', 'error', 'critical'])->default('info');
            $table->timestamp('performed_at'); // Cuándo se realizó la acción
            $table->timestamps();

            // Índices para mejorar rendimiento y consultas
            $table->index('user_id');
            $table->index('action');
            $table->index('entity_type');
            $table->index(['entity_type', 'entity_id']);
            $table->index('performed_at');
            $table->index('level');
            $table->index(['user_id', 'action']);
            $table->index(['user_id', 'performed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
