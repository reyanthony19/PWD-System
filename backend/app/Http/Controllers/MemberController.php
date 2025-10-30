<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\MemberProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\MemberDocument;
use Illuminate\Support\Str;

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
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'severity'     => 'required|string|max:255',
            'monthly_income' => 'required|string|max:255|in:below_5000,5000_10000,10000_20000,20000_30000,30000_50000,above_50000,no_income',
            'dependent' => 'nullable|integer',
            'birthdate'    => 'required|date',
            'sex'          => 'required|string|in:male,female,other',
            'address'      => 'required|string|max:255',
            'barangay'     => 'required|string|max:255',
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
            // Create User
            $user = User::create([
                'username' => $validated['username'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role'     => 'member',
                'status'   => 'pending',
            ]);

            // Generate ID number
            $idNumber = $request->id_number ?? 'PDAO-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);

            // Create Member Profile with additional fields
            $profile = $user->memberProfile()->create([
                'first_name'        => $validated['first_name'],
                'middle_name'       => $request->middle_name,
                'last_name'         => $validated['last_name'],
                'id_number'         => $idNumber,
                'contact_number'    => $request->contact_number,
                'birthdate'         => $validated['birthdate'],
                'sex'               => $validated['sex'],
                'disability_type'   => $request->disability_type,
                'barangay'          => $validated['barangay'],
                'address'           => $validated['address'],
                'blood_type'        => $request->blood_type,
                'sss_number'        => $request->sss_number,
                'philhealth_number' => $request->philhealth_number,
                'guardian_full_name'    => $request->guardian_full_name,
                'guardian_relationship' => $request->guardian_relationship,
                'guardian_contact_number' => $request->guardian_contact_number,
                'guardian_address'       => $request->guardian_address,
                'severity'            => $validated['severity'],
                'monthly_income'      => $validated['monthly_income'],
                'dependent' => $validated['dependent'],
            ]);

            // Handle documents
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
            return response()->json([
                'message' => 'Registration failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update member documents
     */
    public function updateDocument(Request $request, $userId)
    {
        DB::beginTransaction();

        try {
            // Log incoming request for debugging
            Log::info('Document update request received', [
                'user_id' => $userId,
                'files_received' => array_keys($request->allFiles()),
                'all_input_keys' => array_keys($request->all())
            ]);

            // Validate user exists
            $user = User::findOrFail($userId);

            // Get member profile ID for this user
            $memberProfile = MemberProfile::where('user_id', $userId)->first();

            if (!$memberProfile) {
                return response()->json([
                    'message' => 'Member profile not found',
                    'success' => false
                ], 404);
            }

            // Validate request has at least one document
            $request->validate([
                'picture_2x2' => 'sometimes|file|mimes:jpeg,jpg,png,pdf|max:5120',
                'barangay_indigency' => 'sometimes|file|mimes:jpeg,jpg,png,pdf|max:10240',
                'medical_certificate' => 'sometimes|file|mimes:jpeg,jpg,png,pdf|max:10240',
                'birth_certificate' => 'sometimes|file|mimes:jpeg,jpg,png,pdf|max:10240',
            ]);

            // Check if at least one file was uploaded
            $hasFiles = false;
            foreach (['picture_2x2', 'barangay_indigency', 'medical_certificate', 'birth_certificate'] as $field) {
                if ($request->hasFile($field)) {
                    $hasFiles = true;
                    break;
                }
            }

            if (!$hasFiles) {
                return response()->json([
                    'message' => 'No documents provided for upload',
                    'success' => false
                ], 400);
            }

            // Find or create member documents record
            $memberDocument = MemberDocument::where('member_profile_id', $memberProfile->id)->first();

            if (!$memberDocument) {
                $memberDocument = new MemberDocument();
                $memberDocument->member_profile_id = $memberProfile->id;
                $memberDocument->hard_copy_submitted = false;
                $memberDocument->remarks = null;
            }

            $updatedDocuments = [];
            $storagePath = 'public/documents';

            // Ensure storage directory exists
            if (!Storage::exists($storagePath)) {
                Storage::makeDirectory($storagePath);
            }

            // Process each document field
            $documentFields = [
                'picture_2x2',
                'barangay_indigency',
                'medical_certificate',
                'birth_certificate'
            ];

            foreach ($documentFields as $field) {
                if ($request->hasFile($field)) {
                    $file = $request->file($field);

                    Log::info("Processing file upload for {$field}", [
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                    ]);

                    // Delete old file if exists
                    $oldFilePath = $memberDocument->$field;
                    if ($oldFilePath && Storage::exists('public/' . $oldFilePath)) {
                        Storage::delete('public/' . $oldFilePath);
                        Log::info("Deleted old file: {$oldFilePath}");
                    }

                    // Generate unique filename
                    $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                    $extension = $file->getClientOriginalExtension();
                    $filename = Str::slug($field) . '_' . $userId . '_' . time() . '.' . $extension;

                    // Store file
                    $filePath = $file->storeAs($storagePath, $filename);

                    // Update database record - store relative path without 'public/'
                    $relativePath = str_replace('public/', '', $filePath);
                    $memberDocument->$field = $relativePath;
                    $updatedDocuments[$field] = $relativePath;

                    Log::info("File uploaded successfully for user {$userId}: {$field} -> {$relativePath}");
                }
            }

            // Save the document record
            $memberDocument->save();

            DB::commit();

            return response()->json([
                'message' => 'Documents updated successfully',
                'success' => true,
                'documents' => $updatedDocuments,
                'member_document_id' => $memberDocument->id
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Document validation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Validation failed',
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('User not found: ' . $e->getMessage());
            return response()->json([
                'message' => 'User not found',
                'success' => false
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Document update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update documents',
                'success' => false,
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // Update member profile by admin
    public function updateMemberProfile(Request $request, $userId)
    {
        DB::beginTransaction();

        try {
            // Find the user
            $user = User::findOrFail($userId);

            // Validate the request data
            $validated = $request->validate([
                // User fields
                'username' => 'sometimes|required|string|max:255|unique:users,username,' . $userId,
                'email' => 'sometimes|required|string|email|unique:users,email,' . $userId,

                // Member profile fields
                'first_name' => 'sometimes|required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'birthdate' => 'sometimes|required|date',
                'sex' => 'sometimes|required|string|in:male,female',
                'contact_number' => 'nullable|string|max:20',
                'address' => 'sometimes|required|string|max:255',
                'barangay' => 'sometimes|required|string|max:255',
                'disability_type' => 'nullable|string|max:255',
                'blood_type' => 'nullable|string|max:5',
                'sss_number' => 'nullable|string|max:50',
                'philhealth_number' => 'nullable|string|max:50',
                'guardian_full_name' => 'nullable|string|max:255',
                'guardian_relationship' => 'nullable|string|max:255',
                'guardian_contact_number' => 'nullable|string|max:20',
                'guardian_address' => 'nullable|string|max:255',
            ]);

            Log::info('Updating member profile', [
                'user_id' => $userId,
                'validated_data' => $validated
            ]);

            // Update user fields if provided
            if (isset($validated['username'])) {
                $user->username = $validated['username'];
            }
            if (isset($validated['email'])) {
                $user->email = $validated['email'];
            }
            $user->save();

            // Find or create member profile
            $memberProfile = MemberProfile::where('user_id', $userId)->first();

            if (!$memberProfile) {
                // Create new member profile if it doesn't exist
                $memberProfile = new MemberProfile();
                $memberProfile->user_id = $userId;

                // Generate ID number for new profiles
                $idNumber = 'PDAO-' . str_pad($userId, 4, '0', STR_PAD_LEFT);
                $memberProfile->id_number = $idNumber;
            }

            // Update member profile fields
            $profileFields = [
                'first_name',
                'middle_name',
                'last_name',
                'birthdate',
                'sex',
                'contact_number',
                'address',
                'barangay',
                'disability_type',
                'blood_type',
                'sss_number',
                'philhealth_number',
                'guardian_full_name',
                'guardian_relationship',
                'guardian_contact_number',
                'guardian_address'
            ];

            foreach ($profileFields as $field) {
                if (isset($validated[$field])) {
                    $memberProfile->$field = $validated[$field];
                }
            }

            $memberProfile->save();

            DB::commit();

            // Reload the user with relationships
            $updatedUser = User::with(['memberProfile', 'memberProfile.documents'])->find($userId);

            return response()->json([
                'message' => 'Member profile updated successfully',
                'user' => $updatedUser,
                'success' => true
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error in updateMemberProfile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'success' => false
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('User not found in updateMemberProfile: ' . $e->getMessage());
            return response()->json([
                'message' => 'User not found',
                'success' => false
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating member profile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update member profile',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error',
                'success' => false
            ], 500);
        }
    }

    /**
     * Update hard copy document status for a member
     */
    public function updateHardCopyStatus(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            // Find the user
            $user = User::findOrFail($id);

            // Validate the request - only hard_copy_submitted and remarks
            $validated = $request->validate([
                'hard_copy_submitted' => 'required|boolean',
                'remarks' => 'nullable|string|max:500'
            ]);

            // Get the member profile
            $memberProfile = $user->memberProfile;

            if (!$memberProfile) {
                return response()->json([
                    'message' => 'Member profile not found'
                ], 404);
            }

            // Find or create member document record
            $memberDocument = MemberDocument::where('member_profile_id', $memberProfile->id)->first();

            if (!$memberDocument) {
                // Create new document record if it doesn't exist
                $memberDocument = MemberDocument::create([
                    'member_profile_id' => $memberProfile->id,
                    'hard_copy_submitted' => $validated['hard_copy_submitted'],
                    'remarks' => $validated['remarks'] ?? null,
                ]);
            } else {
                // Update existing document record
                $memberDocument->update([
                    'hard_copy_submitted' => $validated['hard_copy_submitted'],
                    'remarks' => $validated['remarks'] ?? null,
                ]);
            }

            DB::commit();

            // Return updated user data
            $updatedUser = User::with(['memberProfile', 'memberProfile.documents'])->find($id);

            return response()->json([
                'message' => 'Hard copy status updated successfully',
                'user' => $updatedUser
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Hard copy status update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update hard copy status',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
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
