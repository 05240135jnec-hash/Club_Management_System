<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\ImageAlbum;
use Illuminate\Http\Request;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;

class StudentController extends Controller
{
    // ── GET clubs student has joined ──────────────────────────
    public function myClubs(Request $request)
    {
        $user = $request->user();

        $memberships = ClubMember::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('club.advisor:id,name')
            ->get();

        $clubs = $memberships->map(function ($m) {
            $club = $m->club;
            if (!$club) return null;
            return [
                'id'            => $club->id,
                'name'          => $club->name,
                'category'      => $club->category,
                'description'   => $club->description,
                'members_count' => ClubMember::where('club_id', $club->id)->where('status', 'active')->count(),
                'advisor'       => $club->advisor ? ['name' => $club->advisor->name] : null,
                // ✅ FIX: use club_members.role (per-club role) NOT users.role (global role)
                // $m->role = 'secretary' for DIT Maintenance, 'member' for Radio Club
                'member_role'   => $m->role ?: 'member',
            ];
        })->filter()->values();

        return response()->json(['clubs' => $clubs]);
    }

    // ── GET albums for a club ─────────────────────────────────
    public function clubAlbums(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $albums = ImageAlbum::where('club_id', $club->id)
            ->with('images')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($album) {
                return [
                    'id'          => $album->id,
                    'title'       => $album->title,
                    'caption'     => $album->caption,
                    'uploaded_by' => $album->uploader->name ?? '—',
                    'created_at'  => $album->created_at->format('M d, Y'),
                    'images'      => $album->images->map(function ($img) {
                        return [
                            'id'        => $img->id,
                            'url'       => asset('storage/' . $img->file_path),
                            'file_name' => $img->file_name,
                        ];
                    }),
                ];
            });

        return response()->json(['albums' => $albums]);
    }

    // ── GET announcements for student's club ──────────────────
    public function announcements(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $announcements = \App\Models\Announcement::where('club_id', $club->id)
            ->with('creator')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($a) {
                return [
                    'id'        => $a->id,
                    'title'     => $a->title,
                    'content'   => $a->content,
                    'type'      => $a->type,
                    'image'     => $a->attachment ? asset('storage/' . $a->attachment) : null,
                    'date_sent' => $a->created_at->format('M d, Y'),
                    'posted_by' => $a->creator->name ?? '—',
                ];
            });

        return response()->json(['announcements' => $announcements]);
    }

    // ── GET members for a club ────────────────────────────────
    public function clubMembers(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $members = ClubMember::where('club_id', $club->id)
            ->where('status', 'active')
            ->with('user:id,name,email,course,year,student_id')
            ->get()
            ->map(function ($m) {
                return [
                    'id'         => $m->id,
                    'name'       => $m->user->name ?? '—',
                    'email'      => $m->user->email ?? '—',
                    'course'     => $m->user->course ?? '—',
                    'year'       => $m->user->year ?? '—',
                    'student_id' => $m->user->student_id ?? '—',
                    'joined_at'  => $m->created_at->format('M d, Y'),
                ];
            });

        return response()->json(['members' => $members]);
    }

    // ── GET work plans for a club ─────────────────────────────
    public function clubWorkPlans(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $workPlans = \App\Models\WorkPlan::where('club_id', $club->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($w) {
                return [
                    'id'          => $w->id,
                    'title'       => $w->title,
                    'file_name'   => $w->file_name,
                    'file_url'    => asset('storage/' . $w->file_path),
                    'uploaded_by' => $w->uploader->name ?? '—',
                    'created_at'  => $w->created_at->format('M d, Y'),
                ];
            });

        return response()->json(['work_plans' => $workPlans]);
    }

    // ── GET blogs for a club ──────────────────────────────────
    public function clubBlogs(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $blogs = \App\Models\Blog::where('club_id', $club->id)
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($b) {
                return [
                    'id'          => $b->id,
                    'title'       => $b->title,
                    'author'      => $b->author,
                    'content'     => $b->content,
                    'cover_image' => $b->cover_image ? asset('storage/' . $b->cover_image) : null,
                    'uploaded_by' => $b->uploader->name ?? '—',
                    'created_at'  => $b->created_at->format('M d, Y'),
                ];
            });

        return response()->json([
            'blogs'        => $blogs,
            'blog_enabled' => (bool) $club->blog_enabled,
        ]);
    }

    // ── GET attendance for student in a club ──────────────────
    public function clubAttendance(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::findOrFail($id);

        $totalSessions = AttendanceSession::where('club_id', $club->id)->count();

        $absentCount = AttendanceRecord::where('user_id', $user->id)
            ->where('status', 'absent')
            ->whereHas('session', function ($q) use ($club) {
                $q->where('club_id', $club->id);
            })
            ->count();

        $presentCount = $totalSessions - $absentCount;
        $overallPct = $totalSessions > 0
            ? round(($presentCount / $totalSessions) * 100)
            : 0;

        $sessions = AttendanceSession::where('club_id', $club->id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($session) use ($user) {
                $record = AttendanceRecord::where('session_id', $session->id)
                    ->where('user_id', $user->id)
                    ->first();
                return [
                    'id'     => $session->id,
                    'name'   => $session->name,
                    'date'   => $session->date,
                    'status' => $record ? $record->status : 'present',
                ];
            });

        return response()->json([
            'overall_pct'    => $overallPct,
            'total_sessions' => $totalSessions,
            'present'        => $presentCount,
            'absent'         => $absentCount,
            'sessions'       => $sessions,
        ]);
    }
}