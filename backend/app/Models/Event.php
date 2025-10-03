<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'event_date',
        'event_time',
        'user_id',
        'location',
        'status',
        'target_barangay',
    ];

    /* 🔗 Relationships */

    // Event creator (Admin/Staff who created the event)
    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Attendees of this event
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // Users who attended (through attendances)
    public function attendees()
    {
        return $this->belongsToMany(User::class, 'attendances')
                    ->withPivot(['scanned_at', 'scanned_by'])
                    ->withTimestamps();
    }
}
