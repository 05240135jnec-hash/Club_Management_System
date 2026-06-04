<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Club extends Model
{
    protected $fillable = [
        'name',
        'category',
        'description',
        'enrollment_key',
        'max_members', 
        'advisor_id',
        'status',
        'aim',
        'objectives',
        'secretary',
        'audit_report_enabled',
        'blog_enabled',
        'cover_photo',
    ];

    // Club belongs to an advisor
    public function advisor()
    {
        return $this->belongsTo(User::class, 'advisor_id');
    }

    // Club has many members (students)
    public function members()
    {
        return $this->hasMany(ClubMember::class);
    }
}