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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('restrict');
            $table->enum('status', ['active', 'cancelled', 'expired', 'suspended', 'pending_payment'])->default('active');
            $table->timestamp('starts_at')->useCurrent(); // Fecha de inicio de la suscripción
            $table->timestamp('ends_at')->nullable(); // Fecha de fin de la suscripción
            $table->timestamp('cancelled_at')->nullable(); // Fecha de cancelación
            $table->enum('payment_method', ['mercado_pago', 'free'])->default('free');
            $table->string('mercado_pago_subscription_id')->nullable()->unique(); // ID de suscripción en MercadoPago
            $table->string('mercado_pago_payment_id')->nullable(); // ID del último pago
            $table->decimal('amount', 10, 2)->default(0); // Monto pagado
            $table->string('currency', 3)->default('USD'); // Moneda
            $table->json('payment_metadata')->nullable(); // Metadatos del pago
            $table->timestamp('last_payment_at')->nullable(); // Último pago exitoso
            $table->timestamp('next_billing_at')->nullable(); // Próxima fecha de facturación
            $table->integer('videos_used_this_month')->default(0); // Videos usados en el mes actual
            $table->timestamp('usage_reset_at')->nullable(); // Cuándo se resetea el contador
            $table->boolean('auto_renew')->default(true); // Renovación automática
            $table->text('cancellation_reason')->nullable(); // Razón de cancelación
            $table->timestamps();

            // Índices para mejorar rendimiento
            $table->index('user_id');
            $table->index('plan_id');
            $table->index('status');
            $table->index('ends_at');
            $table->index('next_billing_at');
            $table->index(['user_id', 'status']);
            $table->index(['status', 'ends_at']);
            $table->index(['status', 'next_billing_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
