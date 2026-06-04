<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubMember extends Model
{
    protected $fillable = [
        'club_id',
        'user_id',
        'status',
        'role', 
        'removed_at',
    ];

    protected $casts = [
        'removed_at' => 'datetime',
    ];

    // Belongs to a club
    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    // Belongs to a user (student)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}