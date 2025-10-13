<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Benefit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'budget_amount',    // per participant amount (if cash)
        'budget_quantity',  // per participant quantity (if relief)
        'unit',             
        'locked_member_count',
        'item_name',        // for other type benefits
        'item_description', // for other type benefits
        'item_quantity',    // for other type benefits
        'status',
    ];

    protected $casts = [
        'budget_amount' => 'decimal:2',
        'budget_quantity' => 'integer',
        'item_quantity' => 'integer',
        'locked_member_count' => 'integer',
    ];

    public function records()
    {
        return $this->hasMany(BenefitRecord::class, 'benefit_id');
    }

    public function participants()
    {
        return $this->hasMany(BenefitParticipant::class);
    }

    /**
     * Accessor: Total distributed amount/quantity
     */
    public function getDistributedTotalAttribute()
    {
        if ($this->type === 'cash') {
            return $this->records()->sum('amount_received');
        }

        if ($this->type === 'relief') {
            return $this->records()->sum('quantity_received');
        }

        if ($this->type === 'other') {
            return $this->records()->count(); // Count of distributed items for "other" type
        }

        return null;
    }

    /**
     * Accessor: Remaining budget/quantity
     */
    public function getRemainingAttribute()
    {
        if ($this->type === 'cash') {
            return $this->budget_amount - $this->distributed_total;
        }

        if ($this->type === 'relief') {
            return $this->budget_quantity - $this->distributed_total;
        }

        if ($this->type === 'other') {
            return $this->item_quantity - $this->distributed_total;
        }

        return null;
    }

    /**
     * Scope for active benefits
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for filtering by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get display name with type indicator
     */
    public function getDisplayNameAttribute()
    {
        $typeLabel = match($this->type) {
            'cash' => '💰',
            'relief' => '📦',
            'other' => '🛠️',
            default => '📋'
        };

        return "{$typeLabel} {$this->name}";
    }
}