<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'club_id',
        'uploaded_by',
        'role',
        'title',
        'type',
        'file_path',
        'file_name',
        'file_size',
        'sent_to',
        'forwarded_to_dsa',
        'forwarded_at',
    ];

    protected $casts = [
        'forwarded_to_dsa' => 'boolean',
        'forwarded_at'     => 'datetime',
    ];

    // Relationships
    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}