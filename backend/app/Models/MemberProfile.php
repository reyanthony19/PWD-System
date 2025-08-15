<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberProfile extends Model
{
    use HasFactory;

    protected $table = 'member_profiles';

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'id_number',
        'birthdate',
        'sex',
        'disability_type',
        'barangay',
        'address',
        'blood_type',
        'sss_number',
        'philhealth_number',
        'qr_code',
        'status',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'status' => 'string',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Correct plural relationship name
     */
    public function documents()
    {
        return $this->hasMany(MemberDocument::class);
    }
}
