<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Benefit extends Model
{
    use HasFactory;

    // Table name (optional if following Laravel naming conventions)
    protected $table = 'benefits';

    // Mass assignable fields
    protected $fillable = [
        'name',
        'type',
        'amount',
        'unit',
        'status',
    ];

    /**
     * Get all the records/claims for this benefit
     */
    public function records()
    {
        return $this->hasMany(BenefitRecord::class, 'benefit_id');
    }
}
