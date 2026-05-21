<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    // ── GET all announcements ────────────────────────────────────
    public function index(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $announcements = Announcement::where('club_id', $club->id)
            ->with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ann) {
                return [
                    'id'              => $ann->id,
                    'title'           => $ann->title,
                    'type'            => $ann->type,
                    'content'         => $ann->content,
                    'recipients'      => $ann->recipients,
                    'created_by'      => $ann->creator->name ?? '—',
                    'date_sent'       => $ann->created_at->format('M d, Y h:i A'),
                    'attachment'      => $ann->attachment
                                            ? asset('storage/' . $ann->attachment)
                                            : null,
                    'attachment_name' => $ann->attachment_name,
                ];
            });

        return response()->json([
            'announcements' => $announcements,
            'total'         => $announcements->count(),
        ]);
    }

    // ── POST create announcement ─────────────────────────────────
    public function store(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'type'       => 'required|in:event,general,reminder',
            'content'    => 'required|string',
            'recipients' => 'required|in:members,students,both',
            'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        ]);

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file           = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('announcements', 'public');
        }

        $announcement = Announcement::create([
            'club_id'         => $club->id,
            'created_by'      => $user->id,
            'title'           => $validated['title'],
            'type'            => $validated['type'],
            'content'         => $validated['content'],
            'recipients'      => $validated['recipients'],
            'attachment'      => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        return response()->json([
            'message'      => 'Announcement posted successfully.',
            'announcement' => [
                'id'              => $announcement->id,
                'title'           => $announcement->title,
                'type'            => $announcement->type,
                'content'         => $announcement->content,
                'recipients'      => $announcement->recipients,
                'created_by'      => $user->name,
                'date_sent'       => $announcement->created_at->format('M d, Y h:i A'),
                'attachment'      => $attachmentPath
                                        ? asset('storage/' . $attachmentPath)
                                        : null,
                'attachment_name' => $attachmentName,
            ],
        ], 201);
    }

    // ── PUT update announcement ──────────────────────────────────
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $announcement = Announcement::where('id', $id)
            ->where('club_id', $club->id)
            ->first();

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        $validated = $request->validate([
            'title'      => 'sometimes|required|string|max:255',
            'type'       => 'sometimes|required|in:event,general,reminder',
            'content'    => 'sometimes|required|string',
            'recipients' => 'sometimes|required|in:members,students,both',
            'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        ]);

        // Handle new file upload
        if ($request->hasFile('attachment')) {
            // Delete old file if exists
            if ($announcement->attachment) {
                Storage::disk('public')->delete($announcement->attachment);
            }
            $file = $request->file('attachment');
            $validated['attachment']      = $file->store('announcements', 'public');
            $validated['attachment_name'] = $file->getClientOriginalName();
        }

        $announcement->update($validated);

        return response()->json([
            'message'      => 'Announcement updated successfully.',
            'announcement' => [
                'id'              => $announcement->id,
                'title'           => $announcement->title,
                'type'            => $announcement->type,
                'content'         => $announcement->content,
                'recipients'      => $announcement->recipients,
                'created_by'      => $user->name,
                'date_sent'       => $announcement->created_at->format('M d, Y h:i A'),
                'attachment'      => $announcement->attachment
                                        ? asset('storage/' . $announcement->attachment)
                                        : null,
                'attachment_name' => $announcement->attachment_name,
            ],
        ]);
    }

    // ── DELETE announcement ──────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $announcement = Announcement::where('id', $id)
            ->where('club_id', $club->id)
            ->first();

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        // Delete file from storage
        if ($announcement->attachment) {
            Storage::disk('public')->delete($announcement->attachment);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully.']);
    }
}