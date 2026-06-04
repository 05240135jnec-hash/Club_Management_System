<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubAdvisor;
use App\Models\User;
use Illuminate\Http\Request;

class TransferClubController extends Controller
{
    // ── GET list of active co-advisors for this club ──────────
    public function coAdvisors(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'advisor') {
            return response()->json(['message' => 'Only the main advisor can appoint a new advisor.'], 403);
        }

        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $coAdvisors = ClubAdvisor::where('club_id', $club->id)
            ->where('is_main', false)
            ->with('user:id,name,email')
            ->get()
            ->map(fn($ca) => [
                'id'      => $ca->id,
                'user_id' => $ca->user_id,
                'name'    => $ca->user->name  ?? '—',
                'email'   => $ca->user->email ?? '—',
            ]);

        return response()->json([
            'club_name'   => $club->name,
            'co_advisors' => $coAdvisors,
        ]);
    }

    // ── POST appoint co-advisor as new main advisor ───────────
    public function appoint(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'advisor') {
            return response()->json(['message' => 'Only the main advisor can appoint a new advisor.'], 403);
        }

        $request->validate([
            'co_advisor_user_id' => 'required|exists:users,id',
        ]);

        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        // Verify selected co-advisor belongs to this club
        $clubAdvisor = ClubAdvisor::where('club_id', $club->id)
            ->where('user_id', $request->co_advisor_user_id)
            ->where('is_main', false)
            ->first();

        if (!$clubAdvisor) {
            return response()->json(['message' => 'Selected co-advisor not found in this club.'], 404);
        }

        $newAdvisor = User::find($request->co_advisor_user_id);

        // ── Step 1: Update club advisor_id to new advisor ──
        $club->update(['advisor_id' => $newAdvisor->id]);

        // ── Step 2: Update new advisor role to 'advisor' ──
        $newAdvisor->update(['role' => 'advisor']);

        // ── Step 3: Remove from club_advisors table ──
        $clubAdvisor->delete();

        // ── Step 4: Old advisor becomes regular user ──
        $user->update(['role' => 'member']);

        // ── Step 5: Force logout old advisor ──
        $user->tokens()->delete();

        return response()->json([
            'message' => 'New advisor appointed successfully. You have been removed as advisor.',
        ]);
    }
}