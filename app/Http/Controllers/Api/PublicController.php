<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\Club;
use App\Models\ImageAlbum;
use App\Models\AlbumImage;
use App\Http\Controllers\Controller;

class PublicController extends Controller
{
    public function getClubAlbums(Request $request, $id)
    {
        $club = Club::find($id);

        if (!$club) {
            return response()->json(['message' => 'Club not found'], 404);
        }

        $albums = ImageAlbum::where('club_id', $id)
            ->with('images')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($album) {
                return [
                    'id'          => $album->id,
                    'title'       => $album->title,
                    'caption'     => $album->caption,
                    'uploaded_by' => $album->uploaded_by ?? $album->user?->name ?? 'Unknown',
                    'created_at'  => $album->created_at?->format('M d, Y'),
                    'images'      => $album->images->map(function ($img) {
                        return [
                            'id'        => $img->id,
                            'url'       => asset('storage/' . $img->file_path),  // ← fixed
                            'file_name' => $img->file_name,                       // ← fixed
                        ];
                    }),
                ];
            });

        return response()->json(['albums' => $albums]);
    }
}