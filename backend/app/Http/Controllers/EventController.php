<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     */
    public function index()
    {
        $events = Event::with('creator')->latest()->paginate(10);
        return response()->json($events);
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date'  => 'required|date',
            'event_time'  => 'nullable|date_format:H:i',
            'location'    => 'required|string|max:255',
            'status'      => 'in:upcoming,completed,cancelled',
        ]);

        $validated['user_id'] = Auth::id(); // event creator

        $event = Event::create($validated);

        return response()->json([
            'message' => 'Event created successfully.',
            'event'   => $event,
        ], 201);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        $event->load(['creator', 'attendees']);
        return response()->json($event);
    }

    /**
     * Update the specified event.
     */
    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'event_date'  => 'sometimes|date',
            'event_time'  => 'nullable|date_format:H:i',
            'location'    => 'sometimes|string|max:255',
            'status'      => 'in:upcoming,completed,cancelled',
        ]);

        $event->update($validated);

        return response()->json([
            'message' => 'Event updated successfully.',
            'event'   => $event,
        ]);
    }

    /**
     * Remove the specified event.
     */
    public function destroy(Event $event)
    {
        $event->delete();

        return response()->json([
            'message' => 'Event deleted successfully.'
        ]);
    }
}
