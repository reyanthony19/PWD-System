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
            'status'   => 'nullable|in:approved,inactive,deceased,rejected,pending',
        ]);

        $user = User::create([
            'username'     => $request->username,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => $request->role ?? 'member',
            'status'   => $request->status ?? 'pending',
        ]);

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
        if ($request->user()->id !== (int)$id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'old_password' => 'nullable|string',
            'password' => 'nullable|string|min:3',
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'birthdate' => 'nullable|date',
            'address' => 'nullable|string|max:255',
        ]);

        // ✅ Require old password if changing password
        if (!empty($validated['password'])) {
            if (empty($validated['old_password'])) {
                return response()->json(['message' => 'Old password is required to change password.'], 422);
            }
            if (!Hash::check($validated['old_password'], $user->password)) {
                return response()->json(['message' => 'Old password is incorrect.'], 422);
            }
            $user->password = Hash::make($validated['password']);
        }

        $user->username = $validated['username'];
        $user->email = $validated['email'];
        $user->save();

        $profileData = collect($validated)
            ->only(['first_name', 'middle_name', 'last_name', 'contact_number', 'birthdate', 'address'])
            ->filter(fn($value) => $value !== null)
            ->toArray();

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

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,inactive,deceased,rejected,pending',
        ]);

        $user = User::findOrFail($id);
        $user->status = $validated['status'];
        $user->save();

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => $user
        ], 200);
    }
    
}
