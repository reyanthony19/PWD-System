<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    /**
     * Register a new user (admin, staff, or member)
     */
    public function register(Request $request)
    {
        // Base rules
        $rules = [
            'username'     => 'required|string|max:255',
            'email'        => 'required|string|email|unique:users,email',
            'password'     => 'required|string|min:3',
            'role'         => 'nullable|in:admin,staff,member',
            'status'       => 'nullable|in:approved,inactive,deceased,rejected,pending',

            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'birthdate'    => 'required|date',
            'address'      => 'required|string|max:255',
        ];

        $role = $request->role ?? 'member';

        // Add staff-specific rules
        if ($role === 'staff') {
            $rules = array_merge($rules, [
                'barangay'       => 'required|string|max:255',
                'contact_number' => 'nullable|string|max:20',
            ]);
        }

        // Add member-specific rules
        if ($role === 'member') {
            $rules = array_merge($rules, [
                'sex'               => 'required|string|in:male,female,other',
                'id_number'         => 'nullable|string|max:255',
                'disability_type'   => 'nullable|string|max:255',
                'barangay'          => 'required|string|max:255',
                'contact_number'    => 'nullable|string|max:20',
                'blood_type'        => 'nullable|string|max:5',
                'sss_number'        => 'nullable|string|max:50',
                'philhealth_number' => 'nullable|string|max:50',

                'guardian_full_name'       => 'nullable|string|max:255',
                'guardian_relationship'    => 'nullable|string|max:255',
                'guardian_contact_number'  => 'nullable|string|max:20',
                'guardian_address'         => 'nullable|string|max:255',

                // Documents
                'barangay_indigency'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
                'medical_certificate' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
                'picture_2x2'         => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
                'birth_certificate'   => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
                'hard_copy_received'  => 'nullable|boolean',
                'remarks'             => 'nullable|string|max:255',
            ]);
        }

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            $user = User::create([
                'username' => $validated['username'],
                'email'    => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role'     => $role,
                'status'   => $validated['status'] ?? 'pending',
            ]);

            // Profile based on role
            switch ($role) {
                case 'admin':
                    $user->adminProfile()->create([
                        'first_name'  => $validated['first_name'],
                        'middle_name' => $request->middle_name,
                        'last_name'   => $validated['last_name'],
                        'birthdate'   => $validated['birthdate'],
                        'address'     => $validated['address'],
                    ]);
                    break;

                case 'staff':
                    $user->staffProfile()->create([
                        'first_name'      => $validated['first_name'],
                        'middle_name'     => $request->middle_name,
                        'last_name'       => $validated['last_name'],
                        'birthdate'       => $validated['birthdate'],
                        'address'         => $validated['address'],
                        'barangay'        => $validated['barangay'],
                        'contact_number'  => $validated['contact_number'] ?? null,
                    ]);
                    break;

                case 'member':
                    $idNumber = $validated['id_number'] ?? 'MEM-' . str_pad($user->id, 6, '0', STR_PAD_LEFT);

                    $profile = $user->memberProfile()->create([
                        'first_name'        => $validated['first_name'],
                        'middle_name'       => $request->middle_name,
                        'last_name'         => $validated['last_name'],
                        'id_number'         => $idNumber,
                        'contact_number'    => $validated['contact_number'] ?? null,
                        'birthdate'         => $validated['birthdate'],
                        'sex'               => $validated['sex'],
                        'disability_type'   => $validated['disability_type'] ?? null,
                        'barangay'          => $validated['barangay'],
                        'address'           => $validated['address'],
                        'blood_type'        => $validated['blood_type'] ?? null,
                        'sss_number'        => $validated['sss_number'] ?? null,
                        'philhealth_number' => $validated['philhealth_number'] ?? null,
                        'guardian_full_name'    => $validated['guardian_full_name'] ?? null,
                        'guardian_relationship' => $validated['guardian_relationship'] ?? null,
                        'guardian_contact_number' => $validated['guardian_contact_number'] ?? null,
                        'guardian_address'       => $validated['guardian_address'] ?? null,
                    ]);

                    $profile->documents()->create([
                        'barangay_indigency'  => $request->hasFile('barangay_indigency')
                            ? Storage::url($request->file('barangay_indigency')->store('documents', 'public')) : null,
                        'medical_certificate' => $request->hasFile('medical_certificate')
                            ? Storage::url($request->file('medical_certificate')->store('documents', 'public')) : null,
                        'picture_2x2'         => $request->hasFile('picture_2x2')
                            ? Storage::url($request->file('picture_2x2')->store('documents', 'public')) : null,
                        'birth_certificate'   => $request->hasFile('birth_certificate')
                            ? Storage::url($request->file('birth_certificate')->store('documents', 'public')) : null,
                        'hard_copy_received'  => $validated['hard_copy_received'] ?? false,
                        'remarks'             => $validated['remarks'] ?? null,
                    ]);
                    break;
            }

            $token = $user->createToken('token')->plainTextToken;
            DB::commit();

            return response()->json([
                'user' => $user->load($role . 'Profile'),
                'token' => $token
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Registration failed',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

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
            'user' => $user->load($user->role . 'Profile'),
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
    $user = User::with('memberProfile.documents', 'adminProfile')
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
            'username' => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,' . $id,
            'old_password' => 'nullable|string',
            'password' => 'nullable|string|min:3',

            'first_name'  => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name'   => 'nullable|string|max:255',
            'birthdate'   => 'nullable|date',
            'address'     => 'nullable|string|max:255',
        ];

        if ($role === 'staff') {
            $rules = array_merge($rules, [
                'barangay'       => 'nullable|string|max:255',
                'contact_number' => 'nullable|string|max:20',
            ]);
        }

        if ($role === 'member') {
            $rules = array_merge($rules, [
                'sex'               => 'nullable|string|in:male,female,other',
                'disability_type'   => 'nullable|string|max:255',
                'barangay'          => 'nullable|string|max:255',
                'contact_number'    => 'nullable|string|max:20',
                'blood_type'        => 'nullable|string|max:5',
                'sss_number'        => 'nullable|string|max:50',
                'philhealth_number' => 'nullable|string|max:50',
                'guardian_full_name'       => 'nullable|string|max:255',
                'guardian_relationship'    => 'nullable|string|max:255',
                'guardian_contact_number'  => 'nullable|string|max:20',
                'guardian_address'         => 'nullable|string|max:255',
            ]);
        }

        $validated = $request->validate($rules);

        if (!empty($validated['password'])) {
            if (empty($validated['old_password'])) {
                return response()->json(['message' => 'Old password is required.'], 422);
            }
            if (!Hash::check($validated['old_password'], $user->password)) {
                return response()->json(['message' => 'Old password is incorrect.'], 422);
            }
            $user->password = Hash::make($validated['password']);
        }

        $user->username = $validated['username'];
        $user->email    = $validated['email'];
        $user->save();

        $profileData = collect($validated)->except(['username', 'email', 'password', 'old_password'])->toArray();

        if ($role === 'admin') {
            $user->adminProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
        } elseif ($role === 'staff') {
            $user->staffProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
        } elseif ($role === 'member') {
            $user->memberProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
        }

        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => $user->load($role . 'Profile')
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
            'user' => $user
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
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
