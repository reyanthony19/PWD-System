<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    /**
     * Login
     */
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

        return response()->json([
            'user'  => $user->load($user->role . 'Profile'),
            'token' => $token
        ], 200);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Authenticated profile
     */
    public function profile(Request $request)
    {
        $user = $request->user()->load($request->user()->role . 'Profile');
        return response()->json($user);
    }

    /**
     * Show specific user
     */
    public function showUser($id)
    {
        $user = User::with('memberProfile.documents', 'adminProfile', 'staffProfile')
            ->findOrFail($id);

        return response()->json($user);
    }

    /**
     * List users
     */
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

    /**
     * Update user (role-specific validation)
     */
    public function updateUser(Request $request, $id)
    {
        if ($request->user()->id !== (int)$id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        $role = $user->role;

        $rules = [
            'username'     => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email,' . $id,
            'old_password' => 'nullable|string',
            'password'     => 'nullable|string|min:3',

            // profile fields
            'first_name'     => 'nullable|string|max:255',
            'middle_name'    => 'nullable|string|max:255',
            'last_name'      => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'birthdate'      => 'nullable|date',
            'address'        => 'nullable|string|max:500',
        ];

        $validated = $request->validate($rules);

        // Handle password update
        if (!empty($validated['password'])) {
            if (empty($validated['old_password'])) {
                return response()->json(['message' => 'Old password is required.'], 422);
            }
            if (!Hash::check($validated['old_password'], $user->password)) {
                return response()->json(['message' => 'Old password is incorrect.'], 422);
            }
            $user->password = Hash::make($validated['password']);
        }

        // Update users table
        $user->username = $validated['username'];
        $user->email    = $validated['email'];
        $user->save();

        // Update profile table depending on role
        $profileData = collect($validated)->only([
            'first_name',
            'middle_name',
            'last_name',
            'contact_number',
            'birthdate',
            'address'
        ])->toArray();

        if ($role === 'admin' && $user->adminProfile) {
            $user->adminProfile->update($profileData);
        } elseif ($role === 'staff' && $user->staffProfile) {
            $user->staffProfile->update($profileData);
        } elseif ($role === 'member' && $user->memberProfile) {
            $user->memberProfile->update($profileData);
        }

        return response()->json([
            'message' => 'User and profile updated successfully!',
            'user'    => $user->load($role . 'Profile')
        ]);
    }

    /**
     * Update status
     */
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
            'user'    => $user
        ], 200);
    }

    /**
     * Delete user
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($request->user()->id !== (int)$id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $user->delete();
            return response()->json(['message' => 'User deleted successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete user.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
