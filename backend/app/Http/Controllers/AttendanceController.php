<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    /**
     * Display a listing of attendances.
     */
    public function index(Event $event)
    {
        $cacheKey = "event_attendances:{$event->id}:page:" . request('page', 1);
        
        $attendances = Cache::remember($cacheKey, 1800, function () use ($event) { // 30 minutes
            return Attendance::with(['user.memberProfile', 'event', 'scannedBy.staffProfile'])
                ->where('event_id', $event->id)
                ->latest()
                ->paginate(20);
        });

        return response()->json($attendances);
    }

    /**
     * Get attendance records for a specific event
     */
    public function getEventAttendances($eventId)
    {
        $cacheKey = "event_attendances_all:{$eventId}";
        
        $attendances = Cache::remember($cacheKey, 1800, function () use ($eventId) { // 30 minutes
            return Attendance::with(['user.memberProfile', 'scannedBy.staffProfile'])
                ->where('event_id', $eventId)
                ->get();
        });

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

        // Clear relevant caches
        $this->clearAttendanceCaches($event->id, $validated['user_id']);

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

        // Clear relevant caches
        $this->clearAttendanceCaches($eventId, $validated['user_id']);

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
        $cacheKey = "attendance:{$attendance->id}";
        
        $attendanceData = Cache::remember($cacheKey, 3600, function () use ($attendance) { // 1 hour
            return $attendance->load(['user', 'event', 'scannedBy']);
        });

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

        // Clear relevant caches
        $this->clearAttendanceCaches($attendance->event_id, $attendance->user_id);

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
        $eventId = $attendance->event_id;
        $userId = $attendance->user_id;
        
        $attendance->delete();

        // Clear relevant caches
        $this->clearAttendanceCaches($eventId, $userId);

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

        // Clear relevant caches
        $this->clearAttendanceCaches($eventId, $userId);

        return response()->json([
            'message' => 'Attendance removed successfully.'
        ]);
    }

    /**
     * Check if a specific user has attended the event.
     */
    public function checkUserAttendance($eventId, $userId)
    {
        $cacheKey = "user_attendance_check:{$eventId}:{$userId}";
        
        $result = Cache::remember($cacheKey, 1800, function () use ($eventId, $userId) { // 30 minutes
            $attendance = Attendance::where('event_id', $eventId)
                ->where('user_id', $userId)
                ->first();

            if ($attendance) {
                return ['attended' => true, 'attendance' => $attendance];
            }

            return ['attended' => false];
        });

        return response()->json($result);
    }

    /**
     * Get all attendances for a user across all events
     */
    public function getUserAttendances($userId)
    {
        $cacheKey = "user_attendances_all:{$userId}";
        
        $attendances = Cache::remember($cacheKey, 3600, function () use ($userId) { // 1 hour
            return Attendance::with(['event', 'scannedBy.staffProfile'])
                ->where('user_id', $userId)
                ->latest('scanned_at')
                ->get();
        });

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

        // FIXED: Sort the array first, then implode
        $sortedUserIds = $validated['user_ids'];
        sort($sortedUserIds);
        $cacheKey = "bulk_attendance_check:{$eventId}:" . md5(implode(',', $sortedUserIds));
        
        $result = Cache::remember($cacheKey, 900, function () use ($eventId, $validated) { // 15 minutes
            $attendances = Attendance::where('event_id', $eventId)
                ->whereIn('user_id', $validated['user_ids'])
                ->get()
                ->keyBy('user_id');

            $result = [];
            foreach ($validated['user_ids'] as $userId) {
                $result[$userId] = isset($attendances[$userId]);
            }

            return $result;
        });

        return response()->json($result);
    }

    /**
     * Clear all relevant attendance caches
     */
    private function clearAttendanceCaches($eventId, $userId)
    {
        // Clear event-specific caches
        Cache::forget("event_attendances:{$eventId}:page:1");
        Cache::forget("event_attendances_all:{$eventId}");
        
        // Clear user-specific caches  
        Cache::forget("user_attendances_all:{$userId}");
        Cache::forget("user_attendance_check:{$eventId}:{$userId}");
        
        // Clear individual attendance cache if we have the ID
        if (request()->route('attendance')) {
            Cache::forget("attendance:" . request()->route('attendance')->id);
        }
        
        // Clear bulk check caches for this event
        $this->clearBulkCheckCaches($eventId);
    }

    /**
     * Clear bulk check caches for an event
     */
    private function clearBulkCheckCaches($eventId)
    {
        // For file cache, we can't easily pattern match, so we'll use a different approach
        // We'll track bulk cache keys in a separate cache entry
        $bulkKeysKey = "bulk_attendance_keys:{$eventId}";
        $bulkKeys = Cache::get($bulkKeysKey, []);
        
        foreach ($bulkKeys as $key) {
            Cache::forget($key);
        }
        
        // Clear the tracking key as well
        Cache::forget($bulkKeysKey);
    }
}