<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubscriptionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener planes y usuarios
        $freePlan = Plan::where('name', 'free')->first();
        $proPlan = Plan::where('name', 'pro')->first();
        $premiumPlan = Plan::where('name', 'premium')->first();

        $adminUser = User::where('email', 'admin@example.com')->first();
        $proUser = User::where('email', 'pro@example.com')->first();
        $freeUser = User::where('email', 'free@example.com')->first();
        $spanishUser = User::where('email', 'spanish@example.com')->first();
        $inactiveUser = User::where('email', 'inactive@example.com')->first();

        $subscriptions = [];

        // Suscripción premium para admin (activa)
        if ($adminUser && $premiumPlan) {
            $subscriptions[] = [
                'user_id' => $adminUser->id,
                'plan_id' => $premiumPlan->id,
                'status' => 'active',
                'starts_at' => now()->subDays(30),
                'ends_at' => now()->addDays(335), // ~11 meses restantes
                'payment_method' => 'mercado_pago',
                'mercado_pago_subscription_id' => 'mp_sub_admin_001',
                'mercado_pago_payment_id' => 'mp_pay_admin_001',
                'amount' => 19.90,
                'currency' => 'USD',
                'payment_metadata' => [
                    'payment_method_id' => 'card',
                    'installments' => 1,
                    'card_last_four' => '4242'
                ],
                'last_payment_at' => now()->subDays(30),
                'next_billing_at' => now()->addDays(335),
                'videos_used_this_month' => 45,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => true,
            ];
        }

        // Suscripción pro para pro user (activa)
        if ($proUser && $proPlan) {
            $subscriptions[] = [
                'user_id' => $proUser->id,
                'plan_id' => $proPlan->id,
                'status' => 'active',
                'starts_at' => now()->subDays(15),
                'ends_at' => now()->addDays(350),
                'payment_method' => 'mercado_pago',
                'mercado_pago_subscription_id' => 'mp_sub_pro_001',
                'mercado_pago_payment_id' => 'mp_pay_pro_001',
                'amount' => 9.90,
                'currency' => 'USD',
                'payment_metadata' => [
                    'payment_method_id' => 'card',
                    'installments' => 1,
                    'card_last_four' => '5555'
                ],
                'last_payment_at' => now()->subDays(15),
                'next_billing_at' => now()->addDays(350),
                'videos_used_this_month' => 12,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => true,
            ];
        }

        // Suscripción free para free user (activa, gratuita)
        if ($freeUser && $freePlan) {
            $subscriptions[] = [
                'user_id' => $freeUser->id,
                'plan_id' => $freePlan->id,
                'status' => 'active',
                'starts_at' => now()->subDays(60),
                'ends_at' => null, // Planes gratuitos no expiran
                'payment_method' => 'free',
                'amount' => 0,
                'currency' => 'USD',
                'last_payment_at' => now()->subDays(60),
                'next_billing_at' => null,
                'videos_used_this_month' => 2,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => true,
            ];
        }

        // Suscripción free para spanish user (activa)
        if ($spanishUser && $freePlan) {
            $subscriptions[] = [
                'user_id' => $spanishUser->id,
                'plan_id' => $freePlan->id,
                'status' => 'active',
                'starts_at' => now()->subDays(45),
                'ends_at' => null,
                'payment_method' => 'free',
                'amount' => 0,
                'currency' => 'USD',
                'last_payment_at' => now()->subDays(45),
                'next_billing_at' => null,
                'videos_used_this_month' => 1,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => true,
            ];
        }

        // Suscripción cancelada
        if ($inactiveUser && $proPlan) {
            $subscriptions[] = [
                'user_id' => $inactiveUser->id,
                'plan_id' => $proPlan->id,
                'status' => 'cancelled',
                'starts_at' => now()->subDays(90),
                'ends_at' => now()->addDays(30),
                'cancelled_at' => now()->subDays(10),
                'payment_method' => 'mercado_pago',
                'mercado_pago_subscription_id' => 'mp_sub_cancelled_001',
                'amount' => 9.90,
                'currency' => 'USD',
                'payment_metadata' => [
                    'cancelled_reason' => 'user_request'
                ],
                'last_payment_at' => now()->subDays(90),
                'next_billing_at' => now()->addDays(30),
                'videos_used_this_month' => 0,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => false,
                'cancellation_reason' => 'No longer need the service',
            ];
        }

        // Suscripción expirada
        if ($proUser && $freePlan) {
            $subscriptions[] = [
                'user_id' => $proUser->id,
                'plan_id' => $freePlan->id,
                'status' => 'expired',
                'starts_at' => now()->subDays(400),
                'ends_at' => now()->subDays(30),
                'payment_method' => 'mercado_pago',
                'mercado_pago_subscription_id' => 'mp_sub_expired_001',
                'amount' => 9.90,
                'currency' => 'USD',
                'last_payment_at' => now()->subDays(400),
                'next_billing_at' => now()->subDays(30),
                'videos_used_this_month' => 0,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => false,
            ];
        }

        // Suscripción pendiente de pago
        if ($spanishUser && $premiumPlan) {
            $subscriptions[] = [
                'user_id' => $spanishUser->id,
                'plan_id' => $premiumPlan->id,
                'status' => 'pending_payment',
                'starts_at' => now()->subDays(5),
                'ends_at' => now()->addDays(360),
                'payment_method' => 'mercado_pago',
                'amount' => 19.90,
                'currency' => 'USD',
                'payment_metadata' => [
                    'payment_attempted' => true,
                    'failure_reason' => 'insufficient_funds'
                ],
                'last_payment_at' => null,
                'next_billing_at' => now()->addDays(360),
                'videos_used_this_month' => 0,
                'usage_reset_at' => now()->endOfMonth(),
                'auto_renew' => true,
            ];
        }

        foreach ($subscriptions as $subscriptionData) {
            Subscription::create($subscriptionData);
        }
    }
}
