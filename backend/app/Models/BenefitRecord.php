<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BenefitRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',           // the member user
        'benefit_id',
        'scanned_by',        // staff user
        'amount_received',
        'quantity_received',
        'claimed_at',
        'remarks',
    ];

    protected $casts = [
        'claimed_at' => 'datetime',
        'amount_received' => 'float',
        'quantity_received' => 'integer',
    ];

    /* 🔗 Relationships */

    // The member who received the benefit
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // The benefit associated with this record
    public function benefit()
    {
        return $this->belongsTo(Benefit::class, 'benefit_id');
    }

    // Staff/admin who scanned this record
    public function scannedBy()
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }
}
