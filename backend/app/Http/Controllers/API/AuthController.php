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
        $user = User::with('memberProfile','memberProfile.documents', 'adminProfile', 'staffProfile')
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

    /**
     * Update user (role-specific validation)
     */
    public function updateUser(Request $request, $id)
    {
        // Find the user to update
        $user = User::findOrFail($id);
        $role = $user->role;

        $rules = [
            'username'     => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email,' . $id,

            // Profile fields validation
            'first_name'     => 'nullable|string|max:255',
            'middle_name'    => 'nullable|string|max:255',
            'last_name'      => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'birthdate'      => 'nullable|date',
            'address'        => 'nullable|string|max:500',
            'gender'         => 'nullable|string|in:male,female,other',
            'barangay'       => 'nullable|string|max:255',
            'blood_type'     => 'nullable|string|max:5',
            'disability_type' => 'nullable|string|max:255',
        ];

        // File validation (for document uploads)
        if ($request->hasFile('barangay_indigency')) {
            $rules['barangay_indigency'] = 'file|mimes:jpg,jpeg,png,pdf|max:2048';
        }
        if ($request->hasFile('medical_certificate')) {
            $rules['medical_certificate'] = 'file|mimes:jpg,jpeg,png,pdf|max:2048';
        }
        if ($request->hasFile('picture_2x2')) {
            $rules['picture_2x2'] = 'file|mimes:jpg,jpeg,png|max:2048';
        }
        if ($request->hasFile('birth_certificate')) {
            $rules['birth_certificate'] = 'file|mimes:jpg,jpeg,png,pdf|max:2048';
        }

        // Validate the incoming request
        $validated = $request->validate($rules);

        // Update the user table (without password validation)
        $user->username = $validated['username'];
        $user->email    = $validated['email'];
        $user->save();

        // Prepare profile data (from validated fields)
        $profileData = collect($validated)->only([
            'first_name',
            'middle_name',
            'last_name',
            'contact_number',
            'birthdate',
            'address',
            'gender',
            'barangay',
            'blood_type',
            'disability_type'
        ])->toArray();

        // Handle profile update based on the user role
        if ($role === 'admin' && $user->adminProfile) {
            $user->adminProfile->update($profileData);
        } elseif ($role === 'staff' && $user->staffProfile) {
            $user->staffProfile->update($profileData);
        } elseif ($role === 'member' && $user->memberProfile) {
            $user->memberProfile->update($profileData);
        }

        // Handle document uploads if files are provided
        if ($request->hasFile('barangay_indigency')) {
            $user->memberProfile->documents()->update([
                'barangay_indigency' => $request->file('barangay_indigency')->store('documents', 'public'),
            ]);
        }
        if ($request->hasFile('medical_certificate')) {
            $user->memberProfile->documents()->update([
                'medical_certificate' => $request->file('medical_certificate')->store('documents', 'public'),
            ]);
        }
        if ($request->hasFile('picture_2x2')) {
            $user->memberProfile->documents()->update([
                'picture_2x2' => $request->file('picture_2x2')->store('documents', 'public'),
            ]);
        }
        if ($request->hasFile('birth_certificate')) {
            $user->memberProfile->documents()->update([
                'birth_certificate' => $request->file('birth_certificate')->store('documents', 'public'),
            ]);
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
