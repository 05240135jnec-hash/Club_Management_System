<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BlogController extends Controller
{
    private function formatBlog($blog)
    {
        return [
            'id'          => $blog->id,
            'title'       => $blog->title,
            'author'      => $blog->author,
            'content'     => $blog->content,
            'cover_image' => $blog->cover_image
                                ? asset('storage/' . $blog->cover_image)
                                : null,
            'uploaded_by' => $blog->uploader->name ?? '—',
            'created_at'  => $blog->created_at->format('M d, Y'),
        ];
    }

    // ── GET all blogs for advisor's club ──────────────────────────
    public function index(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $blogs = Blog::where('club_id', $club->id)
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($b) => $this->formatBlog($b));

        return response()->json([
            'blogs' => $blogs,
            'total' => $blogs->count(),
        ]);
    }

    // ── POST create new blog ──────────────────────────────────────
    public function store(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $request->validate([
            'title'       => 'required|string',
            'author'      => 'required|string',
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
            'author'      => $request->author,
            'content'     => $request->content,
            'cover_image' => $coverPath,
        ]);

        return response()->json([
            'message' => 'Blog published successfully.',
            'blog'    => $this->formatBlog($blog->load('uploader')),
        ], 201);
    }

    // ── PUT update blog ───────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $blog = Blog::where('id', $id)->where('club_id', $club->id)->first();

        if (!$blog) {
            return response()->json(['message' => 'Blog not found.'], 404);
        }

        $request->validate([
            'title'       => 'sometimes|required|string',
            'author'      => 'sometimes|required|string',
            'content'     => 'nullable|string',
            'cover_image' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif|max:10240',
        ]);

        $coverPath = $blog->cover_image;
        if ($request->hasFile('cover_image')) {
            // Delete old cover
            if ($blog->cover_image) {
                Storage::disk('public')->delete($blog->cover_image);
            }
            $coverPath = $request->file('cover_image')->store('blogs', 'public');
        }

        $blog->update([
            'title'       => $request->title   ?? $blog->title,
            'author'      => $request->author  ?? $blog->author,
            'content'     => $request->content ?? $blog->content,
            'cover_image' => $coverPath,
        ]);

        return response()->json([
            'message' => 'Blog updated successfully.',
            'blog'    => $this->formatBlog($blog->load('uploader')),
        ]);
    }

    // ── DELETE blog ───────────────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $blog = Blog::where('id', $id)->where('club_id', $club->id)->first();

        if (!$blog) {
            return response()->json(['message' => 'Blog not found.'], 404);
        }

        if ($blog->cover_image) {
            Storage::disk('public')->delete($blog->cover_image);
        }

        $blog->delete();

        return response()->json(['message' => 'Blog deleted successfully.']);
    }
}