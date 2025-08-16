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

    protected $casts = [
        'birthdate' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Auto-generate member ID when creating
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($member) {
            if (empty($member->id_number)) {
                $latestId = self::max('id') + 1;
                $member->id_number = now()->format('Y-m') . '-' . str_pad($latestId, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * A member can have many documents
     */
    public function documents()
    {
        return $this->hasMany(MemberDocument::class);
    }
}
