<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'id_number',
        'contact_number',
        'birthdate',
        'sex',
        'guardian_full_name',
        'guardian_relationship',
        'guardian_contact_number',
        'guardian_address',
        'disability_type',
        'barangay',
        'address',
        'blood_type',
        'sss_number',
        'philhealth_number',
        'qr_code',
    ];

    /**
     * A member profile belongs to a user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * A member profile has one set of documents
     */
    public function documents()
    {
        return $this->hasOne(MemberDocument::class);
    }
}
