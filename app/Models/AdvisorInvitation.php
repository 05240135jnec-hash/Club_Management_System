<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdvisorInvitation extends Model
{
    protected $fillable = [
        'club_id',
        'email',
        'token',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}