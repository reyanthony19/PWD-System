<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberDocument extends Model
{
    use HasFactory;

    protected $table = 'member_documents';

    protected $fillable = [
        'member_profile_id',
        'document_type',
        'file_path',
        'status',
        'hard_copy_received',
        'remarks',
    ];

    protected $casts = [
        'hard_copy_received' => 'boolean',
    ];

    /**
     * Each document belongs to a specific member profile.
     */
    public function memberProfile()
    {
        return $this->belongsTo(MemberProfile::class);
    }
}
