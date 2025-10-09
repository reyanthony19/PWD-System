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
