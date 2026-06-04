<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\ClubAdvisor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BlogController extends Controller
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

    private function formatBlog($blog)
    {
        return [
            'id'          => $blog->id,
            'title'       => $blog->title,
            // ✅ author falls back to uploader name if not set
            'author'      => $blog->author ?? ($blog->uploader->name ?? '—'),
            'content'     => $blog->content,
            'cover_image' => $blog->cover_image ? asset('storage/' . $blog->cover_image) : null,
            'uploaded_by' => $blog->uploader->name ?? '—',
            'updated_by'  => $blog->updater->name ?? null,
            'owner_id'    => $blog->uploaded_by,
            'created_at'  => $blog->created_at->format('M d, Y'),
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $blogs = Blog::where('club_id', $club->id)
            ->with(['uploader:id,name', 'updater:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()->map(fn($b) => $this->formatBlog($b));

        return response()->json([
            'blogs'                => $blogs,
            'total'                => $blogs->count(),
            'blog_enabled'         => (bool) $club->blog_enabled,
            'audit_report_enabled' => (bool) $club->audit_report_enabled,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $request->validate([
            'title'       => 'required|string',
            // ✅ FIX: author is now optional — defaults to the logged-in user's name
            'author'      => 'nullable|string',
            'content'     => 'required|string',
            'cover_image' => 'required|file|mimes:jpg,jpeg,png,webp,gif|max:10240',
        ]);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $request->file('cover_image')->store('blogs', 'public');
        }

        $blog = Blog::create([
            'club_id'     => $club->id,
            'uploaded_by' => $user->id,
            'title'       => $request->title,
            // ✅ FIX: use submitted author or fall back to logged-in user's name
            'author'      => $request->author ?? $user->name,
            'content'     => $request->content,
            'cover_image' => $coverPath,
        ]);

        return response()->json([
            'message' => 'Blog published successfully.',
            'blog'    => $this->formatBlog($blog->load(['uploader', 'updater'])),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $blog = Blog::where('id', $id)->where('club_id', $club->id)->first();
        if (!$blog) return response()->json(['message' => 'Blog not found.'], 404);

        $request->validate([
            'title'       => 'sometimes|required|string',
            // ✅ FIX: author optional on update too
            'author'      => 'nullable|string',
            'content'     => 'nullable|string',
            'cover_image' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif|max:10240',
        ]);

        $coverPath = $blog->cover_image;
        if ($request->hasFile('cover_image')) {
            if ($blog->cover_image) Storage::disk('public')->delete($blog->cover_image);
            $coverPath = $request->file('cover_image')->store('blogs', 'public');
        }

        $blog->update([
            'title'       => $request->title   ?? $blog->title,
            'author'      => $request->author  ?? $blog->author ?? $user->name,
            'content'     => $request->content ?? $blog->content,
            'cover_image' => $coverPath,
            'updated_by'  => $user->id,
        ]);

        return response()->json([
            'message' => 'Blog updated successfully.',
            'blog'    => $this->formatBlog($blog->load(['uploader', 'updater'])),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $blog = Blog::where('id', $id)->where('club_id', $club->id)->first();
        if (!$blog) return response()->json(['message' => 'Blog not found.'], 404);

        if ($blog->cover_image) Storage::disk('public')->delete($blog->cover_image);
        $blog->delete();

        return response()->json(['message' => 'Blog deleted successfully.']);
    }
}