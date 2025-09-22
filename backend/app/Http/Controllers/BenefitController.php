<?php

namespace App\Http\Controllers;

use App\Models\Benefit;
use App\Models\BenefitRecord;
use App\Models\BenefitParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BenefitController extends Controller
{
    /**
     * List all benefits
     */
    public function index()
    {
        $benefits = Benefit::withCount('records')->get();
        return response()->json($benefits);
    }

    public function listBenefits()
    {
        return $this->index();
    }

    public function storeBenefit(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'type'   => 'required|in:cash,relief',
            'budget_amount'   => 'nullable|numeric',
            'budget_quantity' => 'nullable|integer',
            'unit'   => 'nullable|string|max:50',
            'status' => 'nullable|in:active,inactive',
        ]);

        // ✅ Step 1: create the benefit
        $benefit = Benefit::create($request->all());

        // ✅ Step 2: get all approved *members only*
        $approvedMembers = User::where('role', 'member')
            ->where('status', 'approved')
            ->pluck('id');

        // ✅ Step 3: insert into benefit_participants
        foreach ($approvedMembers as $userId) {
            BenefitParticipant::create([
                'benefit_id' => $benefit->id,
                'user_id'    => $userId,
            ]);
        }

        // ✅ Step 4: update locked_member_count
        $benefit->locked_member_count = $approvedMembers->count();

        // ✅ Step 5: auto-compute budget
        if ($benefit->type === 'cash' && $request->has('amount')) {
            $benefit->budget_amount = $request->amount * $approvedMembers->count();
        }

        if ($benefit->type === 'relief' && $request->has('quantity')) {
            $benefit->budget_quantity = $request->quantity * $approvedMembers->count();
        }

        $benefit->save();


        return response()->json([
            'message' => 'Benefit created successfully with participants locked (approved members only).',
            'benefit' => $benefit,
        ], 201);
    }
    
    public function checkUserClaim($benefitId, $userId)
    {
        // Check if the user has claimed the benefit
        $claim = BenefitRecord::where('benefit_id', $benefitId)
            ->where('user_id', $userId)
            ->first();

        if ($claim) {
            return response()->json(['claimed' => true]);
        }

        return response()->json(['claimed' => false]);
    }

    public function showBenefit($id)
    {
        $benefit = Benefit::with('records')->findOrFail($id);
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
        ]);

        $benefit->update($request->all());

        return response()->json($benefit);
    }

    /**
     * Delete a benefit
     */
    public function destroyBenefit($id)
    {
        $benefit = Benefit::findOrFail($id);
        $benefit->delete();

        return response()->json(['message' => 'Benefit deleted successfully']);
    }

    /**
     * List all benefit records
     */
    public function indexRecords()
    {
        $records = BenefitRecord::with(['benefit', 'user.memberProfile', 'scannedBy.staffProfile'])->get();
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

        return response()->json([
            'message' => 'Benefit record created successfully.',
            'record'  => $record,
        ], 201);
    }

    public function showRecord($id)
    {
        $record = BenefitRecord::with(['benefit', 'user.memberProfile', 'scannedBy.staffProfile'])->findOrFail($id);
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

        return response()->json($record);
    }

    public function destroyRecord($id)
    {
        $record = BenefitRecord::findOrFail($id);
        $record->delete();

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
        $claims = $benefit->records()
            ->with(['user.memberProfile', 'scannedBy.staffProfile'])
            ->latest()
            ->get();

        return response()->json($claims);
    }

    // POST /benefits/{benefit}/claims
    public function storeClaim(Request $request, Benefit $benefit)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // ✅ Check if user is in benefit_participants
        $isParticipant = \App\Models\BenefitParticipant::where('benefit_id', $benefit->id)
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


        return response()->json($record, 201);
    }
}
