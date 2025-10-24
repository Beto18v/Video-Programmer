<?php

namespace App\Actions\Fortify;

use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        // Obtener rol CLIENTE por defecto
        $clienteRole = Role::where('name', 'CLIENTE')->first();
        // Obtener plan gratuito por defecto
        $freePlan = Plan::where('name', 'free')->first();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'role_id' => $clienteRole?->id,
            'current_plan_id' => $freePlan?->id,
        ]);
    }
}
