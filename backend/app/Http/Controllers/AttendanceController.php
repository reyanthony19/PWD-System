<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    /**
     * Display a listing of attendances.
     */
    public function index(Event $event)
    {
        $attendances = Attendance::with(['user.memberProfile', 'event', 'scannedBy.staffProfile'])
            ->where('event_id', $event->id)
            ->latest()
            ->paginate(20);

        return response()->json($attendances);
    }

    /**
     * Store a new attendance record (scan QR).
     */
    public function store(Request $request, Event $event)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $attendance = Attendance::firstOrCreate(
            [
                'user_id'  => $validated['user_id'],
                'event_id' => $event->id,
            ],
            [
                'scanned_by' => Auth::id(),
                'scanned_at' => now(),
            ]
        );

        return response()->json([
            'message'    => 'Attendance recorded successfully.',
            'attendance' => $attendance->load(['user', 'scannedBy']),
        ], 201);
    }

    /**
     * Show a specific attendance.
     */
    public function show(Attendance $attendance)
    {
        $attendance->load(['user', 'event', 'scannedBy']);
        return response()->json($attendance);
    }

    /**
     * Update attendance (e.g., adjust scanned_by or scanned_at).
     */
    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'scanned_by' => 'nullable|exists:users,id',
            'scanned_at' => 'nullable|date',
        ]);

        $attendance->update($validated);

        return response()->json([
            'message'    => 'Attendance updated successfully.',
            'attendance' => $attendance,
        ]);
    }

    /**
     * Delete attendance (remove from event).
     */
    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return response()->json([
            'message' => 'Attendance removed successfully.'
        ]);
    }

    /**
     * Check if a specific user has attended the event.
     */
    // In AttendanceController.php
    public function checkUserAttendance($eventId, $userId)
    {
        // Query the attendance table to check if the user attended the event
        $attendance = Attendance::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if ($attendance) {
            return response()->json(['attended' => true]);
        }

        return response()->json(['attended' => false]);
    }
}
