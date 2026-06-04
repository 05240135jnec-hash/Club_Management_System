<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditFeedback extends Model
{
    protected $table = 'audit_feedbacks';

    protected $fillable = [
        'report_id',
        'user_id',
        'feedback',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}