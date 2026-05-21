<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImageAlbum extends Model
{
    protected $fillable = [
        'club_id',
        'uploaded_by',
        'title',
        'caption',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function images()
    {
        return $this->hasMany(AlbumImage::class, 'album_id');
    }
}