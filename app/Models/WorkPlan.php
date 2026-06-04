<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkPlan extends Model
{
    protected $fillable = [
        'club_id',
        'uploaded_by',
        'updated_by',      // 👈 added
        'title',
        'file_path',
        'file_name',
        'file_size',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by'); // 👈 added
    }
}