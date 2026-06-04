<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AttendanceSession extends Model
{
    protected $fillable = [
        'club_id',
        'name',
        'date',
        'created_by',
        'updated_by',      // 👈 added
    ];
    public function club()
    {
        return $this->belongsTo(Club::class);
    }
    public function records()
    {
        return $this->hasMany(AttendanceRecord::class, 'session_id');
    }
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by'); // 👈 added
    }
}