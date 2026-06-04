<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'club_id',
        'created_by',
        'updated_by',      // 👈 added
        'title',
        'type',
        'content',
        'recipients',
        'attachment',
        'attachment_name',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by'); // 👈 added
    }
}