<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event_id',
        'scanned_by',
        'scanned_at',
    ];

    /* 🔗 Relationships */

    // The member who attended
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // The event they attended
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    // The staff/admin who scanned
    public function scannedBy()
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }
}
