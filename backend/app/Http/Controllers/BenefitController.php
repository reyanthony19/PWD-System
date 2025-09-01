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
     * Store a new benefit
     */
    // Add this function for the route
    public function listBenefits()
    {
        return $this->index();
    }

    public function storeBenefit(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,relief,medical,other',
            'amount' => 'nullable|numeric',
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
            'type' => 'sometimes|in:cash,relief,medical,other',
            'amount' => 'nullable|numeric',
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
     * List all benefit records
     */
    public function indexRecords()
    {
        $records = BenefitRecord::with(['benefit', 'member', 'processedBy'])->get();
        return response()->json($records);
    }

    /**
     * Store a new benefit record
     */
    public function storeRecord(Request $request)
    {
        $request->validate([
            'member_id' => 'required|exists:member_profiles,id',
            'benefit_id' => 'required|exists:benefits,id',
            'processed_by' => 'nullable|exists:users,id',
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
        $record = BenefitRecord::with(['benefit', 'member', 'processedBy'])->findOrFail($id);
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
            'processed_by' => 'nullable|exists:users,id',
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
}
