<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Plan;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Asignar plan gratuito por defecto a nuevos usuarios
        if (!$user->current_plan_id) {
            $freePlan = Plan::where('name', 'free')->first();
            if ($freePlan) {
                $user->update(['current_plan_id' => $freePlan->id]);
            }
        }
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        //
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
