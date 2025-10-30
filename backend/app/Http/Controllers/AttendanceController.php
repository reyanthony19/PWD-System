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
     * Get attendance records for a specific event
     */
    public function getEventAttendances($eventId)
    {
        $attendances = Attendance::with(['user.memberProfile', 'scannedBy.staffProfile'])
            ->where('event_id', $eventId)
            ->get();

        return response()->json($attendances);
    }

    /**
     * Store a new attendance record (scan QR).
     */
    public function store(Request $request, Event $event)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'status' => 'sometimes|string|in:present,absent',
            'attended_at' => 'sometimes|date',
        ]);

        $attendance = Attendance::firstOrCreate(
            [
                'user_id'  => $validated['user_id'],
                'event_id' => $event->id,
            ],
            [
                'scanned_by' => Auth::id(),
                'scanned_at' => $validated['attended_at'] ?? now(),
                'status' => $validated['status'] ?? 'present',
            ]
        );

        return response()->json([
            'message'    => 'Attendance recorded successfully.',
            'attendance' => $attendance->load(['user', 'scannedBy']),
        ], 201);
    }

    /**
     * Create attendance for specific event
     */
    public function createAttendance(Request $request, $eventId)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'status' => 'required|string|in:present,absent',
            'attended_at' => 'sometimes|date',
        ]);

        // Check if attendance already exists
        $existingAttendance = Attendance::where('event_id', $eventId)
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Attendance already exists for this user and event.',
                'attendance' => $existingAttendance,
            ], 409);
        }

        $attendance = Attendance::create([
            'user_id' => $validated['user_id'],
            'event_id' => $eventId,
            'scanned_by' => Auth::id(),
            'scanned_at' => $validated['attended_at'] ?? now(),
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Attendance created successfully.',
            'attendance' => $attendance->load(['user', 'scannedBy']),
        ], 201);
    }

    /**
     * Show a specific attendance.
     */
    public function show(Attendance $attendance)
    {
        $attendanceData = $attendance->load(['user', 'event', 'scannedBy']);

        return response()->json($attendanceData);
    }

    /**
     * Update attendance (e.g., adjust scanned_by or scanned_at).
     */
    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'scanned_by' => 'nullable|exists:users,id',
            'scanned_at' => 'nullable|date',
            'status' => 'sometimes|string|in:present,absent',
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
     * Delete attendance by event and user
     */
    public function destroyByEventAndUser($eventId, $userId)
    {
        $attendance = Attendance::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if (!$attendance) {
            return response()->json([
                'message' => 'Attendance record not found.'
            ], 404);
        }

        $attendance->delete();

        return response()->json([
            'message' => 'Attendance removed successfully.'
        ]);
    }

    /**
     * Check if a specific user has attended the event.
     */
    public function checkUserAttendance($eventId, $userId)
    {
        $attendance = Attendance::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if ($attendance) {
            return response()->json(['attended' => true, 'attendance' => $attendance]);
        }

        return response()->json(['attended' => false]);
    }

    /**
     * Get all attendances for a user across all events
     */
    public function getUserAttendances($userId)
    {
        $attendances = Attendance::with(['event', 'scannedBy.staffProfile'])
            ->where('user_id', $userId)
            ->latest('scanned_at')
            ->get();

        return response()->json($attendances);
    }

    /**
     * Bulk check attendance for multiple users in an event
     */
    public function bulkCheckAttendance(Request $request, $eventId)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $attendances = Attendance::where('event_id', $eventId)
            ->whereIn('user_id', $validated['user_ids'])
            ->get()
            ->keyBy('user_id');

        $result = [];
        foreach ($validated['user_ids'] as $userId) {
            $result[$userId] = isset($attendances[$userId]);
        }

        return response()->json($result);
    }
}