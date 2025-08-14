<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:3',
            'role'     => 'nullable|in:admin,staff,member',  // Optional role input
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => $request->role ?? 'member',  // default role 'member' if not provided
            'status'   => 'pending',  // default status for new user
        ]);

        $token = $user->createToken('token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
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

        return response()->json(['user' => $user, 'token' => $token], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    public function showUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    // Updated listUsers to support filtering by role via query param: ?role=admin
    public function listUsers(Request $request)
    {
        $role = $request->query('role');

        if ($role && in_array($role, ['admin', 'staff', 'member'])) {
            $users = User::where('role', $role)->get();
        } else {
            $users = User::all();
        }

        return response()->json($users);
    }

    /**
     * Update the specified user's profile.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateUser(Request $request, $id)
    {
        // Allow admins to update any user; regular users only their own profile
        if ($request->user()->id !== (int)$id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:3',
        ];

        // Only admins can update the role
        if ($request->user()->role === 'admin') {
            $rules['role'] = 'required|in:admin,staff,member';
            $rules['status'] = 'sometimes|in:pending,approved,rejected';
        }

        $validated = $request->validate($rules);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
        }

        if (isset($validated['status'])) {
            $user->status = $validated['status'];
        }

        $user->save();

        return response()->json(['message' => 'User updated successfully.']);
    }
}
