<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeders en orden correcto para mantener las relaciones de foreign keys
        $this->call([
            RolesSeeder::class,           // Primero los roles
            PlansSeeder::class,           // Luego los planes
            UsersSeeder::class,           // Luego los usuarios (referencian roles y planes)
            ChannelsSeeder::class,        // Canales (referencian usuarios)
            YoutubeCredentialsSeeder::class, // Credenciales (referencian canales)
            VideosSeeder::class,          // Videos (referencian usuarios y canales)
            VideoSchedulesSeeder::class,  // Schedules (referencian videos)
            SubscriptionsSeeder::class,   // Suscripciones (referencian usuarios y planes)
            ActivityLogsSeeder::class,    // Logs de actividad (referencian varias entidades)
        ]);

        // El usuario de prueba ya se crea en UsersSeeder
        // User::firstOrCreate(...) - Removido para evitar duplicados
    }
}
