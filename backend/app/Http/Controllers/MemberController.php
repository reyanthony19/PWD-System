<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Import Log facade for logging
use Carbon\Carbon;

class MemberController extends Controller
{
    /**
     * Register a new member
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username'     => 'required|string|max:255|unique:users,username',
            'email'        => 'required|string|email|unique:users,email',
            'password'     => 'required|string|min:3',

            // Profile fields
            'first_name'   => 'nullable|string|max:255',
            'last_name'    => 'nullable|string|max:255',
            'birthdate'    => 'nullable|date',
            'sex'          => 'nullable|string|in:male,female,other',
            'address'      => 'nullable|string|max:255',
            'barangay'     => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',

            // Optional fields
            'id_number'    => 'nullable|string|max:255',
            'disability_type' => 'nullable|string|max:255',
            'blood_type'   => 'nullable|string|max:5',
            'sss_number'   => 'nullable|string|max:50',
            'philhealth_number' => 'nullable|string|max:50',

            // Guardian
            'guardian_full_name'       => 'nullable|string|max:255',
            'guardian_relationship'    => 'nullable|string|max:255',
            'guardian_contact_number'  => 'nullable|string|max:20',
            'guardian_address'         => 'nullable|string|max:255',

            // Documents
            'barangay_indigency'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'medical_certificate' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'picture_2x2'         => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'birth_certificate'   => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'remarks'             => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $status = (auth()->check() && auth()->user()->role === 'admin')
                ? 'approved'
                : 'pending';

            // Create user
            $user = User::create([
                'username' => $validated['username'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role'     => 'member',
                'status'   => $status,
            ]);

            // Create initial member profile with mostly null/default values
            $profile = $user->memberProfile()->create([
                'first_name'        => $validated['first_name'] ?? 'First name not set',
                'middle_name'       => $request->middle_name ?? 'Middle name not set',
                'last_name'         => $validated['last_name'] ?? 'Last name not set',
                'id_number'         => $validated['id_number'] ?? 'PDAO-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'contact_number'    => $request->contact_number ?? 'No contact yet',
                'birthdate'         => $validated['birthdate'] ?? Carbon::now()->toDateString(),
                'sex'               => $validated['sex'] ?? 'unspecified',
                'disability_type'   => $request->disability_type ?? 'Not declared',
                'barangay'          => $validated['barangay'] ?? 'Barangay not provided',
                'address'           => $validated['address'] ?? 'Address not provided',
                'blood_type'        => $request->blood_type ?? 'Unknown',
                'sss_number'        => $request->sss_number ?? 'N/A',
                'philhealth_number' => $request->philhealth_number ?? 'N/A',
                'guardian_full_name'    => $request->guardian_full_name ?? 'Guardian name missing',
                'guardian_relationship' => $request->guardian_relationship ?? 'Relationship not specified',
                'guardian_contact_number' => $request->guardian_contact_number ?? 'No contact yet',
                'guardian_address'       => $request->guardian_address ?? 'Guardian address missing',
            ]);


            // Handle optional documents
            $profile->documents()->create([
                'barangay_indigency'  => $request->hasFile('barangay_indigency')
                    ? $request->file('barangay_indigency')->store('documents', 'public') : null,
                'medical_certificate' => $request->hasFile('medical_certificate')
                    ? $request->file('medical_certificate')->store('documents', 'public') : null,
                'picture_2x2'         => $request->hasFile('picture_2x2')
                    ? $request->file('picture_2x2')->store('documents', 'public') : null,
                'birth_certificate'   => $request->hasFile('birth_certificate')
                    ? $request->file('birth_certificate')->store('documents', 'public') : null,
                'remarks'             => $request->remarks ?? null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Member registered successfully',
                'user'    => $user->load('memberProfile.documents'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error with detailed information
            Log::error('Registration failed:', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all()  // Optionally, log the request data for better debugging
            ]);

            return response()->json([
                'message' => 'Registration failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Scan member by ID number
     */
    public function scanMember(Request $request)
    {
        $idNumber = $request->query('id_number'); // Use query() for GET

        if (!$idNumber) {
            return response()->json(['message' => 'id_number is required'], 400);
        }

        try {
            $user = User::whereHas('memberProfile', function ($query) use ($idNumber) {
                $query->where('id_number', $idNumber);
            })->with(['memberProfile.documents'])->first();

            if (!$user) {
                return response()->json(['message' => 'Member not found'], 404);
            }

            return response()->json([
                'message' => 'Member found',
                'member'  => $user,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching member data:', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching member data',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
