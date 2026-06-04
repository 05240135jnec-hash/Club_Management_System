<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\ClubAdvisor;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
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
            // ✅ FIX: First try club_members.role = 'secretary'
            $member = ClubMember::where('user_id', $user->id)
                ->where('status', 'active')
                ->where('role', 'secretary')
                ->first();

            // ✅ FIX: Fallback — if club_members.role wasn't synced, use any active membership
            if (!$member) {
                $member = ClubMember::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->first();
            }

            return $member ? Club::find($member->club_id) : null;
        }

        return null;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $announcements = Announcement::where('club_id', $club->id)
            ->with(['creator:id,name', 'updater:id,name'])
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
                    'updated_by'      => $ann->updater->name ?? null,
                    'owner_id'        => $ann->created_by,
                    'date_sent'       => $ann->created_at->format('M d, Y h:i A'),
                    'attachment'      => $ann->attachment ? asset('storage/' . $ann->attachment) : null,
                    'attachment_name' => $ann->attachment_name,
                ];
            });

        return response()->json(['announcements' => $announcements, 'total' => $announcements->count()]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

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

        NotificationService::announcementPosted($club->id, $user->name, $validated['title'], $user->id);

        return response()->json([
            'message'      => 'Announcement posted successfully.',
            'announcement' => [
                'id'              => $announcement->id,
                'title'           => $announcement->title,
                'type'            => $announcement->type,
                'content'         => $announcement->content,
                'recipients'      => $announcement->recipients,
                'created_by'      => $user->name,
                'updated_by'      => null,
                'owner_id'        => $user->id,
                'date_sent'       => $announcement->created_at->format('M d, Y h:i A'),
                'attachment'      => $attachmentPath ? asset('storage/' . $attachmentPath) : null,
                'attachment_name' => $attachmentName,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $announcement = Announcement::where('id', $id)->where('club_id', $club->id)->first();
        if (!$announcement) return response()->json(['message' => 'Announcement not found.'], 404);

        $validated = $request->validate([
            'title'      => 'sometimes|required|string|max:255',
            'type'       => 'sometimes|required|in:event,general,reminder',
            'content'    => 'sometimes|required|string',
            'recipients' => 'sometimes|required|in:members,students,both',
            'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        ]);

        if ($request->hasFile('attachment')) {
            if ($announcement->attachment) Storage::disk('public')->delete($announcement->attachment);
            $file                        = $request->file('attachment');
            $validated['attachment']      = $file->store('announcements', 'public');
            $validated['attachment_name'] = $file->getClientOriginalName();
        }

        $validated['updated_by'] = $user->id;
        $announcement->update($validated);

        return response()->json([
            'message'      => 'Announcement updated successfully.',
            'announcement' => [
                'id'              => $announcement->id,
                'title'           => $announcement->title,
                'type'            => $announcement->type,
                'content'         => $announcement->content,
                'recipients'      => $announcement->recipients,
                'created_by'      => $announcement->creator->name ?? '—',
                'updated_by'      => $user->name,
                'owner_id'        => $announcement->created_by,
                'date_sent'       => $announcement->created_at->format('M d, Y h:i A'),
                'attachment'      => $announcement->attachment ? asset('storage/' . $announcement->attachment) : null,
                'attachment_name' => $announcement->attachment_name,
            ],
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $announcement = Announcement::where('id', $id)->where('club_id', $club->id)->first();
        if (!$announcement) return response()->json(['message' => 'Announcement not found.'], 404);

        if ($announcement->attachment) Storage::disk('public')->delete($announcement->attachment);
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully.']);
    }

    public function studentIndex(Request $request)
    {
        $announcements = Announcement::whereIn('recipients', ['students', 'both'])
            ->with(['creator:id,name', 'club:id,name,category'])
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
                    'club_name'     => $ann->club->name ?? ($ann->creator->name ?? 'Admin'),
                    'club_category' => $ann->club->category ?? 'Administration',
                    'date_sent'       => $ann->created_at->format('M d, Y h:i A'),
                    'attachment'      => $ann->attachment ? asset('storage/' . $ann->attachment) : null,
                    'attachment_name' => $ann->attachment_name,
                ];
            });

        return response()->json(['announcements' => $announcements, 'total' => $announcements->count()]);
    }
    public function advisorIndex(Request $request)
    {
        $announcements = Announcement::whereNull('club_id')
            ->whereIn('recipients', ['advisors', 'both'])
            ->with(['creator:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ann) {
                return [
                    'id'         => $ann->id,
                    'title'      => $ann->title,
                    'type'       => $ann->type,
                    'content'    => $ann->content,
                    'recipients' => $ann->recipients,
                    'created_by' => $ann->creator->name ?? 'Admin',
                    'club_name'  => 'JNEC Admin',
                    'date_sent'  => $ann->created_at->format('M d, Y h:i A'),
                    'attachment' => $ann->attachment ? asset('storage/' . $ann->attachment) : null,
                    'attachment_name' => $ann->attachment_name,
                ];
            });

        return response()->json([
            'announcements' => $announcements,
            'total'         => $announcements->count(),
        ]);
    }
}