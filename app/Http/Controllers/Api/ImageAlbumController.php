<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImageAlbum;
use App\Models\AlbumImage;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\ClubAdvisor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageAlbumController extends Controller
{
    private function getClub($user)
    {
        if ($user->role === 'advisor') {
            return Club::where('advisor_id', $user->id)->first();
        }
        if ($user->role === 'co_advisor') {
            $ca = ClubAdvisor::where('user_id', $user->id)->where('is_main', false)->first();
            return $ca ? Club::find($ca->club_id) : null;
        }
        if ($user->role === 'secretary') {
            $member = ClubMember::where('user_id', $user->id)->where('status', 'active')->where('role', 'secretary')->first();
            if (!$member) {
                $member = ClubMember::where('user_id', $user->id)->where('status', 'active')->first();
            }
            return $member ? Club::find($member->club_id) : null;
        }
        return null;
    }

    private function formatAlbum($album)
    {
        return [
            'id'          => $album->id,
            'title'       => $album->title,
            'caption'     => $album->caption,
            'uploaded_by' => $album->uploader->name ?? '—',
            'updated_by'  => $album->updater->name ?? null,
            'created_at'  => $album->created_at->format('M d, Y'),
            'images'      => $album->images->map(fn($img) => [
                'id'        => $img->id,
                'url'       => asset('storage/' . $img->file_path),
                'file_name' => $img->file_name,
            ]),
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $albums = ImageAlbum::where('club_id', $club->id)
            ->with(['uploader:id,name', 'updater:id,name', 'images'])
            ->orderBy('created_at', 'desc')
            ->get()->map(fn($a) => $this->formatAlbum($a));

        return response()->json(['albums' => $albums, 'total' => $albums->count()]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $request->validate([
            'title'    => 'required|string|max:255',
            'caption'  => 'required|string|max:500',
            'images'   => 'required|array|min:1|max:10',
            'images.*' => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:10240',
        ]);

        $album = ImageAlbum::create(['club_id' => $club->id, 'uploaded_by' => $user->id, 'title' => $request->title, 'caption' => $request->caption]);

        foreach ($request->file('images') as $file) {
            AlbumImage::create(['album_id' => $album->id, 'file_path' => $file->store('albums', 'public'), 'file_name' => $file->getClientOriginalName()]);
        }

        return response()->json(['message' => 'Album created successfully.', 'album' => $this->formatAlbum($album->load(['uploader', 'updater', 'images']))], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $album = ImageAlbum::where('id', $id)->where('club_id', $club->id)->first();
        if (!$album) return response()->json(['message' => 'Album not found.'], 404);

        $request->validate([
            'title'              => 'sometimes|required|string|max:255',
            'caption'            => 'sometimes|required|string|max:500',
            'new_images'         => 'nullable|array',
            'new_images.*'       => 'file|mimes:jpg,jpeg,png,gif,webp|max:10240',
            'remove_image_ids'   => 'nullable|array',
            'remove_image_ids.*' => 'integer',
        ]);

        $album->update(['title' => $request->title ?? $album->title, 'caption' => $request->caption ?? $album->caption, 'updated_by' => $user->id]);

        if ($request->remove_image_ids) {
            $toRemove = AlbumImage::whereIn('id', $request->remove_image_ids)->where('album_id', $album->id)->get();
            foreach ($toRemove as $img) { Storage::disk('public')->delete($img->file_path); $img->delete(); }
        }

        if ($request->hasFile('new_images')) {
            foreach ($request->file('new_images') as $file) {
                AlbumImage::create(['album_id' => $album->id, 'file_path' => $file->store('albums', 'public'), 'file_name' => $file->getClientOriginalName()]);
            }
        }

        return response()->json(['message' => 'Album updated successfully.', 'album' => $this->formatAlbum($album->load(['uploader', 'updater', 'images']))]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $album = ImageAlbum::where('id', $id)->where('club_id', $club->id)->with('images')->first();
        if (!$album) return response()->json(['message' => 'Album not found.'], 404);

        foreach ($album->images as $img) Storage::disk('public')->delete($img->file_path);
        $album->delete();

        return response()->json(['message' => 'Album deleted successfully.']);
    }

    public function destroyImage(Request $request, $imageId)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $image = AlbumImage::whereHas('album', fn($q) => $q->where('club_id', $club->id))->find($imageId);
        if (!$image) return response()->json(['message' => 'Image not found.'], 404);

        Storage::disk('public')->delete($image->file_path);
        $image->delete();

        return response()->json(['message' => 'Image deleted successfully.']);
    }
}