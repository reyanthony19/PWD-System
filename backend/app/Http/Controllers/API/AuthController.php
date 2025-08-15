<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use App\Models\AdminProfile;
use App\Models\StaffProfile;
use App\Models\MemberProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username'     => 'required|string|max:255',
            'email'    => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:3',
            'role'     => 'nullable|in:admin,staff,member',
            'status'   => 'nullable|in:pending,approved,rejected',
        ]);

        $user = User::create([
            'username'     => $request->username,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => $request->role ?? 'member',
            'status'   => $request->status ?? 'pending',
        ]);

        // Automatically create profile based on role
        $profileData = [
            'first_name' => $request->first_name ?? '',
            'middle_name' => $request->middle_name ?? null,
            'last_name'  => $request->last_name ?? '',
            'email'      => $user->email,
            'contact_number'      => $request->contact_number ?? null,
            'birthdate'  => $request->birthdate ?? null,
            'address'    => $request->address ?? null,
        ];

        switch ($user->role) {
            case 'admin':
                $user->adminProfile()->create($profileData);
                break;

            case 'staff':
                $user->staffProfile()->create($profileData);
                break;

            case 'member':
                $user->memberProfile()->create($profileData);
                break;
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json(['user' => $user->load($user->role . 'Profile'), 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json(['user' => $user->load($user->role . 'Profile'), 'token' => $token], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    // Return user with role-specific profile
    public function profile(Request $request)
    {
        $user = $request->user()->load($request->user()->role . 'Profile');
        return response()->json($user);
    }

    public function showUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($user->load($user->role . 'Profile'));
    }

    public function listUsers(Request $request)
    {
        $role = $request->query('role');

        if ($role && in_array($role, ['admin', 'staff', 'member'])) {
            $users = User::where('role', $role)->with("{$role}Profile")->get();
        } else {
            $users = User::with(['adminProfile', 'staffProfile', 'memberProfile'])->get();
        }

        return response()->json($users);
    }

    public function updateUser(Request $request, $id)
    {
        // Prevent users from editing others unless admin
        if ($request->user()->id !== (int)$id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        // Validate only what your form sends
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:3',
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'birthdate' => 'nullable|date',
            'address' => 'nullable|string|max:255',
        ]);

        // Update users table
        $user->username = $validated['username'];
        $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        // Filter out nulls so we only update changed profile fields
        $profileData = collect($validated)
            ->only([
                'first_name',       
                'middle_name',
                'last_name',
                'contact_number',
                'birthdate',
                'address'
            ])
            ->filter(function ($value) {
                return $value !== null;
            })
            ->toArray();

        // Update correct profile table
        if ($user->role === 'admin') {
            $user->adminProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
        } elseif ($user->role === 'staff') {
            $user->staffProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
        } elseif ($user->role === 'member') {
            $user->memberProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
        }

        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => $user->load($user->role . 'Profile')
        ]);
    }
}
