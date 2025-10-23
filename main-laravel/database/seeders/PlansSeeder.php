<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'free',
                'display_name' => 'Plan Gratuito',
                'description' => 'Ideal para comenzar. Perfecto para usuarios que quieren probar la plataforma.',
                'price' => 0,
                'video_limit' => 5,
                'is_active' => true,
                'sort_order' => 1,
                'features' => [
                    '5 videos por mes',
                    'Programación básica',
                    'Soporte por email',
                    '1 canal de YouTube',
                ],
            ],
            [
                'name' => 'pro',
                'display_name' => 'Plan Pro',
                'description' => 'Para creadores de contenido serios. Más videos y funciones avanzadas.',
                'price' => 9.90,
                'video_limit' => 100,
                'is_active' => true,
                'sort_order' => 2,
                'features' => [
                    '100 videos por mes',
                    'Programación avanzada',
                    'Soporte prioritario',
                    '5 canales de YouTube',
                    'Análiticas básicas',
                    'Plantillas de contenido',
                ],
            ],
            [
                'name' => 'premium',
                'display_name' => 'Plan Premium',
                'description' => 'Sin límites. Para profesionales y empresas que necesitan máxima flexibilidad.',
                'price' => 19.90,
                'video_limit' => null, // Ilimitado
                'is_active' => true,
                'sort_order' => 3,
                'features' => [
                    'Videos ilimitados',
                    'Programación masiva',
                    'Soporte 24/7',
                    'Canales ilimitados',
                    'Análiticas avanzadas',
                    'API de integración',
                    'Plantillas premium',
                    'Gestión de equipos',
                ],
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['name' => $planData['name']],
                $planData
            );
        }

        // Asignar plan gratuito a usuarios existentes que no tengan plan
        $freePlan = Plan::where('name', 'free')->first();
        if ($freePlan) {
            \App\Models\User::whereNull('current_plan_id')->update([
                'current_plan_id' => $freePlan->id
            ]);
        }
    }
}
