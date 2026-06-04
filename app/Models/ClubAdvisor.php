<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubAdvisor extends Model
{
    protected $fillable = ['club_id', 'user_id', 'is_main'];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}