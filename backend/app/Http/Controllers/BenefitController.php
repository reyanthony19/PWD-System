<?php

namespace App\Http\Controllers;

use App\Models\Benefit;
use App\Models\BenefitRecord;
use App\Models\BenefitParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class BenefitController extends Controller
{
    /**
     * List all benefits
     */
    public function index()
    {
        $cacheKey = 'benefits:all';
        $benefits = Cache::remember($cacheKey, 3600, function () { // Cache for 1 hour
            return Benefit::withCount('records')->get();
        });

        return response()->json($benefits);
    }

    public function listBenefits()
    {
        return $this->index();
    }

    public function storeBenefit(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,relief',
            'status' => 'nullable|in:active,inactive',
            'selected_members' => 'required|array|min:1',
            'selected_members.*' => 'exists:users,id', // Validates user IDs exist in users table
            'locked_member_count' => 'required|integer|min:1',
        ]);

        // Add conditional validation based on type
        if ($request->type === 'cash') {
            $request->validate([
                'per_participant_amount' => 'required|numeric|min:0'
            ]);
        } else if ($request->type === 'relief') {
            $request->validate([
                'per_participant_quantity' => 'required|numeric|min:0',
                'unit' => 'required|string|max:50'
            ]);
        }

        try {
            DB::beginTransaction();

            // Create the benefit
            $benefitData = [
                'name' => $request->name,
                'type' => $request->type,
                'status' => $request->status ?? 'active',
                'locked_member_count' => $request->locked_member_count,
            ];

            // Handle calculations based on type
            if ($request->type === 'cash') {
                // Store per-participant amount as budget_amount
                $benefitData['budget_amount'] = $request->per_participant_amount;
                $benefitData['budget_quantity'] = null;
                $benefitData['unit'] = null;
            } else if ($request->type === 'relief') {
                // Store per-participant quantity as budget_quantity
                $benefitData['budget_quantity'] = $request->per_participant_quantity;
                $benefitData['unit'] = $request->unit;
                $benefitData['budget_amount'] = null;
            }

            $benefit = Benefit::create($benefitData);

            // ✅ Use the SELECTED members from frontend to create benefit_participants
            foreach ($request->selected_members as $userId) {
                BenefitParticipant::create([
                    'benefit_id' => $benefit->id,
                    'user_id'    => $userId,
                ]);
            }

            DB::commit();

            // Clear relevant caches
            Cache::forget('benefits:all');
            Cache::forget('benefit_records:all');

            return response()->json([
                'message' => 'Benefit created successfully with ' . count($request->selected_members) . ' selected participants.',
                'benefit' => $benefit,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create benefit.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkUserClaim($benefitId, $userId)
    {
        $cacheKey = "benefit_claim:{$benefitId}:{$userId}";
        
        $claim = Cache::remember($cacheKey, 1800, function () use ($benefitId, $userId) { // Cache for 30 minutes
            return BenefitRecord::where('benefit_id', $benefitId)
                ->where('user_id', $userId)
                ->first();
        });

        if ($claim) {
            return response()->json(['claimed' => true]);
        }

        return response()->json(['claimed' => false]);
    }

    public function showBenefit($id)
    {
        $cacheKey = "benefit:{$id}";
        $benefit = Cache::remember($cacheKey, 3600, function () use ($id) {
            return Benefit::with('records')->findOrFail($id);
        });

        return response()->json($benefit);
    }

    public function updateBenefit(Request $request, $id)
    {
        $benefit = Benefit::findOrFail($id);

        $request->validate([
            'name'   => 'sometimes|string|max:255',
            'type'   => 'sometimes|in:cash,relief',
            'budget_amount'   => 'nullable|numeric',
            'budget_quantity' => 'nullable|integer',
            'unit'   => 'nullable|string|max:50',
            'status' => 'nullable|in:active,inactive',
            'selected_members' => 'nullable|array', // New field for adding participants
            'selected_members.*' => 'integer|exists:users,id', // Validate each member ID
        ]);

        // Update basic benefit information
        $benefit->update($request->except(['selected_members']));

        // Handle adding new participants if selected_members is provided
        if ($request->has('selected_members') && is_array($request->selected_members)) {
            $selectedMembers = $request->selected_members;

            // Get existing participant user IDs to avoid duplicates
            $existingParticipantIds = BenefitParticipant::where('benefit_id', $benefit->id)
                ->pluck('user_id')
                ->toArray();

            // Filter out already existing participants
            $newParticipantIds = array_diff($selectedMembers, $existingParticipantIds);

            // Add new participants
            foreach ($newParticipantIds as $userId) {
                // Verify user is an approved member
                $user = User::where('id', $userId)
                    ->where('role', 'member')
                    ->where('status', 'approved')
                    ->first();

                if ($user) {
                    BenefitParticipant::create([
                        'benefit_id' => $benefit->id,
                        'user_id'    => $userId,
                    ]);
                }
            }

            // Update locked_member_count
            $totalParticipants = BenefitParticipant::where('benefit_id', $benefit->id)->count();
            $benefit->locked_member_count = $totalParticipants;
            $benefit->save();

            // Recalculate budget if needed
            if ($benefit->type === 'cash' && $benefit->per_participant_amount) {
                $benefit->budget_amount = $benefit->per_participant_amount * $totalParticipants;
            }

            if ($benefit->type === 'relief' && $benefit->per_participant_quantity) {
                $benefit->budget_quantity = $benefit->per_participant_quantity * $totalParticipants;
            }

            $benefit->save();
        }

        // Clear relevant caches
        Cache::forget('benefits:all');
        Cache::forget("benefit:{$id}");
        Cache::forget("benefit_participants:{$id}");

        // Load the updated benefit with participants
        $benefit->load(['participants', 'participants.member_profile']);

        return response()->json([
            'message' => 'Benefit updated successfully' .
                ($request->has('selected_members') ? ' with new participants added' : ''),
            'benefit' => $benefit,
            'added_participants_count' => $request->has('selected_members') ? count($newParticipantIds ?? []) : 0
        ]);
    }

    /**
     * Delete a benefit
     */
    public function destroyBenefit($id)
    {
        $benefit = Benefit::findOrFail($id);

        // Get the current status and toggle it
        $currentStatus = $benefit->status;
        $newStatus = $currentStatus === 'active' ? 'inactive' : 'active';

        // Update the status
        $benefit->update([
            'status' => $newStatus
        ]);

        // Clear relevant caches
        Cache::forget('benefits:all');
        Cache::forget("benefit:{$id}");
        Cache::forget("benefit_participants:{$id}");

        $action = $newStatus === 'active' ? 'activated' : 'deactivated';

        return response()->json([
            'message' => "Benefit {$action} successfully",
            'status' => $newStatus
        ]);
    }

    /**
     * List all benefit records
     */
    public function indexRecords()
    {
        $cacheKey = 'benefit_records:all';
        $records = Cache::remember($cacheKey, 1800, function () { // Cache for 30 minutes
            return BenefitRecord::with(['benefit', 'user.memberProfile', 'scannedBy.staffProfile'])->get();
        });

        return response()->json($records);
    }

    /**
     * Store a new benefit record (manual add or scan)
     */
    public function storeRecord(Request $request)
    {
        $validated = $request->validate([
            'user_id'     => 'required|exists:users,id',
            'benefit_id'  => 'required|exists:benefits,id',
            'scanned_by'  => 'nullable|exists:users,id',
            'amount_received' => 'nullable|numeric',
            'quantity_received' => 'nullable|integer',
            'claimed_at'  => 'nullable|date',
            'remarks'     => 'nullable|string',
        ]);

        // 🔍 Prevent duplicate record
        $exists = BenefitRecord::where('user_id', $validated['user_id'])
            ->where('benefit_id', $validated['benefit_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This member has already claimed this benefit.'
            ], 409); // Conflict
        }

        $record = BenefitRecord::create(array_merge($validated, [
            'scanned_by' => $validated['scanned_by'] ?? Auth::id(),
        ]));

        // Clear relevant caches
        Cache::forget('benefit_records:all');
        Cache::forget("benefit_claim:{$validated['benefit_id']}:{$validated['user_id']}");
        Cache::forget("benefit:{$validated['benefit_id']}");

        return response()->json([
            'message' => 'Benefit record created successfully.',
            'record'  => $record,
        ], 201);
    }

    public function showRecord($id)
    {
        $cacheKey = "benefit_record:{$id}";
        $record = Cache::remember($cacheKey, 3600, function () use ($id) {
            return BenefitRecord::with(['benefit', 'user.memberProfile', 'scannedBy.staffProfile'])->findOrFail($id);
        });

        return response()->json($record);
    }

    public function updateRecord(Request $request, $id)
    {
        $record = BenefitRecord::findOrFail($id);

        $validated = $request->validate([
            'user_id'     => 'sometimes|exists:users,id',
            'benefit_id'  => 'sometimes|exists:benefits,id',
            'scanned_by'  => 'nullable|exists:users,id',
            'amount_received' => 'nullable|numeric',
            'quantity_received' => 'nullable|integer',
            'status'      => 'nullable|in:pending,claimed,absent',
            'claimed_at'  => 'nullable|date',
            'remarks'     => 'nullable|string',
        ]);

        $record->update($validated);

        // Clear relevant caches
        Cache::forget('benefit_records:all');
        Cache::forget("benefit_record:{$id}");
        if ($record->benefit_id && $record->user_id) {
            Cache::forget("benefit_claim:{$record->benefit_id}:{$record->user_id}");
        }

        return response()->json($record);
    }

    public function destroyRecord($id)
    {
        $record = BenefitRecord::findOrFail($id);
        $benefitId = $record->benefit_id;
        $userId = $record->user_id;
        
        $record->delete();

        // Clear relevant caches
        Cache::forget('benefit_records:all');
        Cache::forget("benefit_record:{$id}");
        Cache::forget("benefit_claim:{$benefitId}:{$userId}");

        return response()->json(['message' => 'Benefit record deleted successfully']);
    }

    /**
     * ----------------------------
     * BENEFIT CLAIMS (like attendance)
     * ----------------------------
     */

    // GET /benefits/{benefit}/claims
    public function indexClaims(Benefit $benefit)
    {
        $cacheKey = "benefit_claims:{$benefit->id}";
        $claims = Cache::remember($cacheKey, 1800, function () use ($benefit) {
            return $benefit->records()
                ->with(['user.memberProfile', 'scannedBy.staffProfile'])
                ->latest()
                ->get();
        });

        return response()->json($claims);
    }

    // POST /benefits/{benefit}/claims
    public function storeClaim(Request $request, Benefit $benefit)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // ✅ Check if user is in benefit_participants
        $isParticipant = BenefitParticipant::where('benefit_id', $benefit->id)
            ->where('user_id', $validated['user_id'])
            ->exists();

        if (!$isParticipant) {
            return response()->json([
                'message' => 'User is not eligible for this benefit.',
            ], 403);
        }

        // Prevent duplicate claim
        $existing = $benefit->records()->where('user_id', $validated['user_id'])->first();
        if ($existing) {
            return response()->json([
                'message' => 'User already claimed this benefit.',
            ], 409);
        }

        $record = $benefit->records()->create([
            'user_id'        => $validated['user_id'],
            'scanned_by'     => Auth::id(),
            'claimed_at'     => now(),
            'remarks'        => 'Successfully claimed via scanner',
            'status'         => 'claimed', // ✅ mark as claimed
            'amount_received' => $benefit->type === 'cash'
                ? $benefit->budget_amount   // ✅ always use budget_amount
                : null,
        ]);

        // Clear relevant caches
        Cache::forget("benefit_claims:{$benefit->id}");
        Cache::forget("benefit_claim:{$benefit->id}:{$validated['user_id']}");
        Cache::forget('benefit_records:all');

        return response()->json($record, 201);
    }

    /**
     * ----------------------------
     * BENEFIT PARTICIPANTS MANAGEMENT
     * ----------------------------
     */

    /**
     * Get all participants for a specific benefit
     * GET /benefits/{benefitId}/participants
     */
    public function getBenefitParticipants($benefitId)
    {
        $cacheKey = "benefit_participants:{$benefitId}";
        $participants = Cache::remember($cacheKey, 3600, function () use ($benefitId) {
            return BenefitParticipant::with('user')
                ->where('benefit_id', $benefitId)
                ->get();
        });

        return response()->json($participants);
    }

    /**
     * Add participants to a benefit
     * POST /benefits/{benefitId}/participants
     */
    public function addParticipants(Request $request, $benefitId)
    {
        $benefit = Benefit::findOrFail($benefitId);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|exists:users,id',
        ]);

        $addedParticipants = [];
        $existingParticipants = [];
        $invalidUsers = [];

        DB::beginTransaction();

        try {
            foreach ($request->user_ids as $userId) {
                $user = User::find($userId);

                // Check if user is eligible (member and approved status)
                if ($user->role !== 'member' || $user->status !== 'approved') {
                    $invalidUsers[] = [
                        'id' => $userId,
                        'name' => $user->name,
                        'reason' => $user->role !== 'member' ? 'User is not a member' : 'User is not approved'
                    ];
                    continue;
                }

                // Check if already a participant
                $existingParticipant = BenefitParticipant::where('benefit_id', $benefitId)
                    ->where('user_id', $userId)
                    ->first();

                if ($existingParticipant) {
                    $existingParticipants[] = [
                        'id' => $userId,
                        'name' => $user->name,
                    ];
                    continue;
                }

                // Add as participant
                $participant = BenefitParticipant::create([
                    'benefit_id' => $benefitId,
                    'user_id' => $userId,
                ]);

                $addedParticipants[] = [
                    'id' => $userId,
                    'name' => $user->name,
                    'participant_id' => $participant->id,
                ];
            }

            // Update the locked_member_count
            $newCount = BenefitParticipant::where('benefit_id', $benefitId)->count();
            $benefit->update([
                'locked_member_count' => $newCount
            ]);

            DB::commit();

            // Clear relevant caches
            Cache::forget("benefit_participants:{$benefitId}");
            Cache::forget("benefit:{$benefitId}");

            return response()->json([
                'message' => 'Participants added successfully',
                'added' => $addedParticipants,
                'existing' => $existingParticipants,
                'invalid' => $invalidUsers,
                'new_participant_count' => $newCount,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to add participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove participants from a benefit
     * DELETE /benefits/{benefitId}/participants
     */
    public function removeParticipants(Request $request, $benefitId)
    {
        $benefit = Benefit::findOrFail($benefitId);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|exists:users,id',
        ]);

        $removedParticipants = [];
        $nonParticipants = [];
        $hasClaims = [];

        DB::beginTransaction();

        try {
            foreach ($request->user_ids as $userId) {
                // Check if user is actually a participant
                $participant = BenefitParticipant::where('benefit_id', $benefitId)
                    ->where('user_id', $userId)
                    ->first();

                if (!$participant) {
                    $nonParticipants[] = [
                        'id' => $userId,
                        'name' => User::find($userId)->name,
                    ];
                    continue;
                }

                // Check if user has already claimed the benefit
                $hasClaimed = BenefitRecord::where('benefit_id', $benefitId)
                    ->where('user_id', $userId)
                    ->exists();

                if ($hasClaimed) {
                    $hasClaims[] = [
                        'id' => $userId,
                        'name' => User::find($userId)->name,
                    ];
                    continue;
                }

                // Remove participant
                $participant->delete();
                $removedParticipants[] = [
                    'id' => $userId,
                    'name' => User::find($userId)->name,
                ];
            }

            // Update the locked_member_count
            $newCount = BenefitParticipant::where('benefit_id', $benefitId)->count();
            $benefit->update([
                'locked_member_count' => $newCount
            ]);

            DB::commit();

            // Clear relevant caches
            Cache::forget("benefit_participants:{$benefitId}");
            Cache::forget("benefit:{$benefitId}");

            return response()->json([
                'message' => 'Participants removed successfully',
                'removed' => $removedParticipants,
                'non_participants' => $nonParticipants,
                'has_claims' => $hasClaims,
                'new_participant_count' => $newCount,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to remove participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}