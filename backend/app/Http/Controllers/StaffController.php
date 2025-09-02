<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    /**
     * Register a new staff user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username'   => 'required|string|max:255',
            'email'      => 'required|string|email|unique:users,email',
            'password'   => 'required|string|min:3',
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'birthdate'  => 'required|date',
            'address'    => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20',
        ]);

        // Create User
        $user = User::create([
            'username' => $validated['username'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'staff',
            'status'   => 'approved',
        ]);

        // Create Staff Profile
        $user->staffProfile()->create([
            'first_name'      => $validated['first_name'],
            'middle_name'     => $request->middle_name,
            'last_name'       => $validated['last_name'],
            'birthdate'       => $validated['birthdate'],
            'address'         => $validated['address'],
            'contact_number'  => $validated['contact_number'] ?? null,
        ]);

        return response()->json([
            'message' => 'Staff registered successfully',
            'user'    => $user->load('staffProfile'),
        ], 201);
    }
}
