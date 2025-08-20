<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_profile_id',
        'barangay_indigency',
        'medical_certificate',
        'picture_2x2',
        'birth_certificate',
        'remarks',
    ];

    
    public function memberProfile()
    {
        return $this->belongsTo(MemberProfile::class);
    }
}
