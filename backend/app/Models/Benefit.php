<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Benefit extends Model
{
    use HasFactory;

    protected $table = 'benefits';

    // Mass assignable fields
    protected $fillable = [
        'name',
        'type',
        'budget_amount',    // total budget (if cash)
        'budget_quantity',  // total stock (if relief)
        'unit',             // unit for relief goods
        'status',
    ];

    /**
     * Get all the records/claims for this benefit
     */
    public function records()
    {
        return $this->hasMany(BenefitRecord::class, 'benefit_id');
    }

    /**
     * Accessor: Remaining budget/quantity
     */
    public function getRemainingAttribute()
    {
        if ($this->type === 'cash') {
            return $this->budget_amount - $this->records()->sum('amount_received');
        }

        if ($this->type === 'relief') {
            return $this->budget_quantity - $this->records()->sum('quantity_received');
        }

        return null;
    }
    // app/Models/Benefit.php
    public function participants()
    {
        return $this->hasMany(BenefitParticipant::class);
    }
}
