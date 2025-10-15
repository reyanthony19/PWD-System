<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffProfile extends Model
{
    use HasFactory;

    /**
     * Table associated with the model
     */
    protected $table = 'staff_profiles';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'middle_name',
        'birthdate',
        'contact_number',
        'assigned_barangay',
        'address',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'birthdate' => 'date',
    ];

    /**
     * Relationship: StaffProfile belongs to a User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}