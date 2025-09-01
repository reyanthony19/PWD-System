<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BenefitRecord extends Model
{
    use HasFactory;

    protected $table = 'benefit_records';

    protected $fillable = [
        'member_id',
        'benefit_id',
        'processed_by',
        'status',
        'claimed_at',
        'remarks',
    ];

    /**
     * Get the member who received the benefit
     */
    public function member()
    {
        return $this->belongsTo(MemberProfile::class, 'member_id');
    }

    /**
     * Get the benefit associated with this record
     */
    public function benefit()
    {
        return $this->belongsTo(Benefit::class, 'benefit_id');
    }

    /**
     * Get the staff/admin who processed this record
     */
    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
