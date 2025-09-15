<?php

namespace App\Models;

// app/Models/BenefitParticipant.php

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BenefitParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'benefit_id',
        'user_id',
    ];

    // Relationships
    public function benefit()
    {
        return $this->belongsTo(Benefit::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
