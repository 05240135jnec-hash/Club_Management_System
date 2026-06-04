<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    // ── Helper: get club for advisor or secretary ──────────────
    private function getClub($user)
    {
        if ($user->role === 'advisor') {
            return Club::where('advisor_id', $user->id)->first();
        }

        if ($user->role === 'co_advisor') {
            $ca = \App\Models\ClubAdvisor::where('user_id', $user->id)
                ->where('is_main', false)->first();
            return $ca ? Club::find($ca->club_id) : null;
        }

        if ($user->role === 'secretary') {
            $member = ClubMember::where('user_id', $user->id)
                ->where('status', 'active')
                ->where('role', 'secretary')
                ->first();
            return $member ? Club::find($member->club_id) : null;
        }

        return null;
    }

    // ── GET all members of advisor's or secretary's club ───────
    // GET /api/clubs/members
    public function index(Request $request)
    {
        $club = $this->getClub($request->user());

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $totalSessions = AttendanceSession::where('club_id', $club->id)->count();

        $members = ClubMember::with('user')
            ->where('club_id', $club->id)
            ->get()
            ->map(function ($member) use ($club, $totalSessions) {

                // ── Calculate overall attendance % ──────────────
                $overallPct = 0;
                if ($totalSessions > 0 && $member->user) {
                    $absentCount = AttendanceRecord::where('user_id', $member->user->id)
                        ->where('status', 'absent')
                        ->whereHas('session', fn($q) => $q->where('club_id', $club->id))
                        ->count();
                    $presentCount = $totalSessions - $absentCount;
                    $overallPct   = round(($presentCount / $totalSessions) * 100);
                }

                return [
                    'id'          => $member->id,
                    'user_id'     => $member->user_id,
                    'name'        => $member->user->name       ?? '—',
                    'email'       => $member->user->email      ?? '—',
                    'student_id'  => $member->user->student_id ?? '—',
                    'course'      => $member->user->course     ?? '—',
                    'year'        => $member->user->year       ?? null,
                    'status'      => $member->status,
                    'role'        => $member->user->role       ?? 'member',
                    'joined_at'   => $member->created_at?->format('M d, Y'),
                    'removed_at'  => $member->removed_at
                                        ? \Carbon\Carbon::parse($member->removed_at)->format('M d, Y')
                                        : null,
                    'overall_pct' => $totalSessions > 0 ? $overallPct : null,
                ];
            });

        return response()->json($members);
    }

    // ── REMOVE member (move to inactive) ──────────────────────
    // PUT /api/clubs/members/{id}/remove
    public function remove(Request $request, $id)
    {
        $club = $this->getClub($request->user());

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $member = ClubMember::where('id', $id)
                            ->where('club_id', $club->id)
                            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $member->update([
            'status'     => 'inactive',
            'removed_at' => now(),
        ]);

        return response()->json(['message' => 'Member moved to inactive.']);
    }

    // ── RESTORE member (move back to active) ──────────────────
    // PUT /api/clubs/members/{id}/restore
    public function restore(Request $request, $id)
    {
        $club = $this->getClub($request->user());

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $member = ClubMember::where('id', $id)
                            ->where('club_id', $club->id)
                            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $member->update([
            'status'     => 'active',
            'removed_at' => null,
        ]);

        return response()->json(['message' => 'Member restored to active.']);
    }

    // ── PERMANENTLY DELETE member ──────────────────────────────
    // DELETE /api/clubs/members/{id}
    public function destroy(Request $request, $id)
    {
        $club = $this->getClub($request->user());

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $member = ClubMember::where('id', $id)
                            ->where('club_id', $club->id)
                            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $member->delete();

        return response()->json(['message' => 'Member permanently deleted.']);
    }

    // ── BULK REMOVE members (move to inactive) ────────────────
    // PUT /api/clubs/members/bulk-remove
    public function bulkRemove(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        $club = $this->getClub($request->user());

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        ClubMember::whereIn('id', $request->ids)
                  ->where('club_id', $club->id)
                  ->update([
                      'status'     => 'inactive',
                      'removed_at' => now(),
                  ]);

        return response()->json(['message' => 'Members moved to inactive.']);
    }

    // ── UPDATE member year ────────────────────────────────────
    public function updateYear(Request $request, $id)
    {
        $request->validate([
            'year' => 'required|in:Year 1,Year 2,Year 3,Year 4',
        ]);

        $club = $this->getClub($request->user());

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $member = ClubMember::where('id', $id)
                            ->where('club_id', $club->id)
                            ->with('user')
                            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $member->user->update(['year' => $request->year]);

        return response()->json(['message' => 'Year updated successfully.', 'year' => $request->year]);
    }
}