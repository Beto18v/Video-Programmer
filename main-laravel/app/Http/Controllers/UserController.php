<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;


class UserController extends Controller


{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::query()->get();
        return response()->json($users);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $role = Role::where('name', $request->role)->first();
        $data = $request->except('role');
        $data['role_id'] = $role->id ?? null;
        $data['password'] = Hash::make($request->password);
        $user = User::create($data);
        return redirect()->back()->with('success', 'Usuario creado exitosamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json($user);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $user->update($request->all());
        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->back()->with('success', 'Usuario eliminado exitosamente');
    }

    public function restore(User $user)
    {
        $user->restore();
        return redirect()->back()->with('success', 'Usuario restaurado exitosamente');
    }

    public function makeAdmin(User $user)
    {
        $role = Role::where('name', 'admin')->first();
        $premiumPlan = \App\Models\Plan::where('name', 'premium')->first();
        if ($role) {
            $user->role_id = $role->id;
            if ($premiumPlan) {
                $user->current_plan_id = $premiumPlan->id;
            }
            $user->save();
            return redirect()->back()->with('success', 'Usuario convertido a admin exitosamente');
        }
        return redirect()->back()->with('error', 'No se encontró el rol admin');
    }
}
