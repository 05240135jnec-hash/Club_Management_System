<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMember;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    // ── GET all members of advisor's club ─────────────────────
    // GET /api/clubs/members
    public function index(Request $request)
    {
        $club = Club::where('advisor_id', $request->user()->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $members = ClubMember::with('user')
            ->where('club_id', $club->id)
            ->get()
            ->map(function ($member) {
                return [
                    'id'         => $member->id,
                    'user_id'    => $member->user_id,
                    'name'       => $member->user->name ?? '—',
                    'email'      => $member->user->email ?? '—',
                    'student_id' => $member->user->student_id ?? '—',
                    'department' => $member->user->department ?? '—',
                    'year'       => $member->user->year ?? null,
                    'status'     => $member->status,
                    'joined_at'  => $member->created_at?->format('M d, Y'),
                    'removed_at' => $member->removed_at
                                    ? \Carbon\Carbon::parse($member->removed_at)->format('M d, Y')
                                    : null,
                ];
            });

        return response()->json($members);
    }

    // ── REMOVE member (move to inactive) ──────────────────────
    // PUT /api/clubs/members/{id}/remove
    public function remove(Request $request, $id)
    {
        $club = Club::where('advisor_id', $request->user()->id)->first();

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
        $club = Club::where('advisor_id', $request->user()->id)->first();

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
        $club = Club::where('advisor_id', $request->user()->id)->first();

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
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $club = Club::where('advisor_id', $request->user()->id)->first();

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
}