<?php

namespace App\Http\Controllers;

use App\Models\Benefit;
use App\Models\BenefitRecord;
use Illuminate\Http\Request;

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

    /**
     * Alias route for listing
     */
    public function listBenefits()
    {
        return $this->index();
    }

    /**
     * Store a new benefit
     */
    public function storeBenefit(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,relief',
            'budget_amount' => 'nullable|numeric',
            'budget_quantity' => 'nullable|integer',
            'unit' => 'nullable|string|max:50',
            'status' => 'nullable|in:active,inactive',
        ]);

        $benefit = Benefit::create($request->all());

        return response()->json($benefit, 201);
    }

    /**
     * Show a single benefit
     */
    public function showBenefit($id)
    {
        $benefit = Benefit::with('records')->findOrFail($id);
        return response()->json($benefit);
    }

    /**
     * Update a benefit
     */
    public function updateBenefit(Request $request, $id)
    {
        $benefit = Benefit::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:cash,relief',
            'budget_amount' => 'nullable|numeric',
            'budget_quantity' => 'nullable|integer',
            'unit' => 'nullable|string|max:50',
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
     * List all benefit records (global)
     */
    public function indexRecords()
    {
        $records = BenefitRecord::with(['benefit', 'member', 'scannedBy'])->get();
        return response()->json($records);
    }

    /**
     * Store a new benefit record (manual add)
     */
    public function storeRecord(Request $request)
    {
        $request->validate([
            'member_id' => 'required|exists:member_profiles,id',
            'benefit_id' => 'required|exists:benefits,id',
            'scanned_by' => 'nullable|exists:users,id',
            'amount_received' => 'nullable|numeric',
            'quantity_received' => 'nullable|integer',
            'status' => 'nullable|in:pending,claimed,absent',
            'claimed_at' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $record = BenefitRecord::create($request->all());

        return response()->json($record, 201);
    }

    /**
     * Show a single benefit record
     */
    public function showRecord($id)
    {
        $record = BenefitRecord::with(['benefit', 'member', 'scannedBy'])->findOrFail($id);
        return response()->json($record);
    }

    /**
     * Update a benefit record
     */
    public function updateRecord(Request $request, $id)
    {
        $record = BenefitRecord::findOrFail($id);

        $request->validate([
            'member_id' => 'sometimes|exists:member_profiles,id',
            'benefit_id' => 'sometimes|exists:benefits,id',
            'scanned_by' => 'nullable|exists:users,id',
            'amount_received' => 'nullable|numeric',
            'quantity_received' => 'nullable|integer',
            'status' => 'nullable|in:pending,claimed,absent',
            'claimed_at' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $record->update($request->all());

        return response()->json($record);
    }

    /**
     * Delete a benefit record
     */
    public function destroyRecord($id)
    {
        $record = BenefitRecord::findOrFail($id);
        $record->delete();

        return response()->json(['message' => 'Benefit record deleted successfully']);
    }

    /**
     * ----------------------------
     * BENEFIT CLAIMS (like attendances)
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
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // Prevent duplicate claim
        $existing = $benefit->records()->where('user_id', $request->user_id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'User already claimed this benefit.',
            ], 409);
        }

        $record = $benefit->records()->create([
            'user_id' => $request->user_id,
            'scanned_by' => $request->user()->id, // staff scanning
            'claimed_at' => now(),
            'status' => 'claimed',
        ]);

        return response()->json($record, 201);
    }
}
