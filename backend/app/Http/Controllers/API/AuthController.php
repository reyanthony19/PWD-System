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
            'login'    => 'required|string',
            'password' => 'required',
        ]);

        // Determine if login is email or username
        $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($loginType, $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'user'  => $user->load($user->role . 'Profile'),
            'token' => $token
        ], 200);
    }

    public function loginMobile(Request $request)
    {
        // Validate input
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Find user by email
        $user = User::where('email', $request->email)->first();

        // Check if user exists and password matches
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Generate API token
        $token = $user->createToken('token')->plainTextToken;

        // Return user with role-based profile and token
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
        $user = User::with('memberProfile', 'memberProfile.documents', 'adminProfile', 'staffProfile')
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
     * Fetch member documents
     */

    public function fetchMemberDocuments($user_id)
    {
        // Find the member profile by user_id
        $user = User::find($user_id);

        // Check if user exists
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Load the member profile and its associated documents
        $memberProfile = $user->memberProfile;

        if (!$memberProfile) {
            return response()->json(['message' => 'Member profile not found'], 404);
        }

        // Fetch the member documents for the member profile
        $documents = $memberProfile->documents;

        // Return the documents as a response
        return response()->json($documents);
    }
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

        // Handle password update - ADMIN BYPASS
        if (!empty($validated['password'])) {
            // If admin is making the request, skip old password validation
            if ($request->user()->role !== 'admin') {
                // For non-admin users (users updating their own password), require old password
                if (empty($validated['old_password'])) {
                    return response()->json(['message' => 'Old password is required.'], 422);
                }
                if (!Hash::check($validated['old_password'], $user->password)) {
                    return response()->json(['message' => 'Old password is incorrect.'], 422);
                }
            }
            // Admin can set password without old password verification
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
    //Hard Copy Checker kung na submit ba o wala 
    public function updateHardCopyStatus(Request $request, $id)
    {
        // Find the user (member)
        $user = User::findOrFail($id);

        // Verify the user is a member
        if ($user->role !== 'member') {
            return response()->json([
                'message' => 'This endpoint is only for members.'
            ], 400);
        }

        // Verify the member has a profile
        if (!$user->memberProfile) {
            return response()->json([
                'message' => 'Member profile not found.'
            ], 404);
        }

        // Validate the request
        $validated = $request->validate([
            'hard_copy_submitted' => 'required|boolean',
            'remarks' => 'nullable|string|max:500',
        ]);

        try {

            // Update or create member documents record
            $updateData = [
                'hard_copy_submitted' => $validated['hard_copy_submitted'],
                'remarks' => $validated['remarks'] ?? null,
            ];

            // Debug: Log the update data

            if ($user->memberProfile->documents) {
                // Update existing documents record
                $user->memberProfile->documents()->update($updateData);
            } else {
                // Create new documents record
                $updateData['member_profile_id'] = $user->memberProfile->id;
                \App\Models\MemberDocument::create($updateData);
            }

            // Reload the user with fresh data
            $user->load('memberProfile.documents');

            // Debug: Log success

            return response()->json([
                'message' => 'Hard copy status updated successfully!',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update hard copy status.',
                'error' => $e->getMessage()
            ], 500);
        }
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
