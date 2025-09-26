<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'birthdate',
        'contact_number', 
        'address',
    ];

    /**
     * Relationship back to User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
