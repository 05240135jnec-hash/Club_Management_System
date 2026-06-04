<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlbumImage extends Model
{
    protected $fillable = [
        'album_id',
        'file_path',
        'file_name',
    ];

    public function album()
    {
        return $this->belongsTo(ImageAlbum::class, 'album_id');
    }
}