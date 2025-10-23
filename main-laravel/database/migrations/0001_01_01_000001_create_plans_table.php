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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique(); // free, pro, premium
            $table->string('display_name', 100); // Free Plan, Pro Plan, Premium Plan
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0); // Precio mensual en USD
            $table->integer('video_limit')->nullable(); // null = ilimitado
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->json('features')->nullable(); // Características adicionales del plan
            $table->timestamps();

            // Índices
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
