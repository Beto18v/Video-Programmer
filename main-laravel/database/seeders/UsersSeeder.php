<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener planes existentes
        $freePlan = Plan::where('name', 'free')->first();
        $proPlan = Plan::where('name', 'pro')->first();
        $premiumPlan = Plan::where('name', 'premium')->first();

        // Obtener roles existentes
        $adminRole = Role::where('name', 'ADMIN')->first();
        $clienteRole = Role::where('name', 'USER')->first();

        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'first_name' => 'Admin',
                'last_name' => 'User',
                'current_plan_id' => $premiumPlan?->id,
                'role_id' => $adminRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
                'timezone' => 'America/New_York',
                'locale' => 'en',
            ],
            [
                'name' => 'Pro User',
                'email' => 'pro@example.com',
                'password' => Hash::make('password'),
                'first_name' => 'Pro',
                'last_name' => 'User',
                'current_plan_id' => $proPlan?->id,
                'role_id' => $clienteRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
                'timezone' => 'Europe/London',
                'locale' => 'en',
            ],
            [
                'name' => 'Free User',
                'email' => 'free@example.com',
                'password' => Hash::make('password'),
                'first_name' => 'Free',
                'last_name' => 'User',
                'current_plan_id' => $freePlan?->id,
                'role_id' => $clienteRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
                'timezone' => 'America/Los_Angeles',
                'locale' => 'en',
            ],
            [
                'name' => 'Inactive User',
                'email' => 'inactive@example.com',
                'password' => Hash::make('password'),
                'first_name' => 'Inactive',
                'last_name' => 'User',
                'current_plan_id' => $freePlan?->id,
                'role_id' => $clienteRole?->id,
                'is_active' => false,
                'email_verified_at' => now(),
                'timezone' => 'UTC',
                'locale' => 'en',
            ],
            [
                'name' => 'Spanish User',
                'email' => 'spanish@example.com',
                'password' => Hash::make('password'),
                'first_name' => 'Usuario',
                'last_name' => 'Español',
                'current_plan_id' => $proPlan?->id,
                'role_id' => $clienteRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
                'timezone' => 'Europe/Madrid',
                'locale' => 'es',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
