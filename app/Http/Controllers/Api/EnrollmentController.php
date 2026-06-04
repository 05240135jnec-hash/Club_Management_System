<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubAdvisor;
use App\Models\ClubMember;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EnrollmentController extends Controller
{
    // ── Helper: get club for advisor or co_advisor ─────────────
    private function getClub($user)
    {
        if ($user->role === 'advisor') {
            return Club::where('advisor_id', $user->id)->withCount('members')->first();
        }

        if ($user->role === 'co_advisor') {
            $ca = ClubAdvisor::where('user_id', $user->id)
                ->where('is_main', false)
                ->first();
            return $ca ? Club::withCount('members')->find($ca->club_id) : null;
        }

        if ($user->role === 'secretary') {
            $member = ClubMember::where('user_id', $user->id)
                ->where('status', 'active')
                ->where('role', 'secretary')
                ->first();
            return $member ? Club::withCount('members')->find($member->club_id) : null;
        }

        return null;
    }

    public function show(Request $request)
    {
        $club = $this->getClub($request->user());
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        return response()->json([
            'enrollment_key' => $club->enrollment_key,
            'max_members'    => $club->max_members,
            'joined'         => $club->members_count,
            'slots_left'     => $club->max_members ? max(0, $club->max_members - $club->members_count) : null,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate(['enrollment_key' => 'required|string|max:50', 'max_members' => 'required|integer|min:1']);
        $club = $this->getClub($request->user());
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $exists = Club::where('enrollment_key', $request->enrollment_key)->where('id', '!=', $club->id)->exists();
        if ($exists) return response()->json(['message' => 'This enrollment key is already in use by another club. Please choose a different key.'], 422);

        $club->update(['enrollment_key' => $request->enrollment_key, 'max_members' => $request->max_members]);

        return response()->json(['message' => 'Enrollment key updated successfully!', 'enrollment_key' => $club->enrollment_key, 'max_members' => $club->max_members]);
    }

    public function revoke(Request $request)
    {
        $club = $this->getClub($request->user());
        if (!$club) return response()->json(['message' => 'No club found.'], 404);
        $club->update(['enrollment_key' => strtoupper(Str::random(8))]);
        return response()->json(['message' => 'Enrollment key regenerated successfully!', 'enrollment_key' => $club->enrollment_key]);
    }

    public function join(Request $request)
    {
        $request->validate(['enrollment_key' => 'required|string']);

        $club = Club::where('enrollment_key', $request->enrollment_key)->withCount('members')->first();
        if (!$club) return response()->json(['message' => 'Invalid enrollment key.'], 404);

        if ($club->max_members && $club->members_count >= $club->max_members) {
            return response()->json(['message' => 'This club is full. No more slots available.'], 422);
        }

        $alreadyJoined = ClubMember::where('club_id', $club->id)->where('user_id', $request->user()->id)->exists();
        if ($alreadyJoined) return response()->json(['message' => 'You are already a member of this club.'], 422);

        // ✅ Max 2 clubs per student (any category)
        $clubCount = ClubMember::where('user_id', $request->user()->id)->count();
        // ✅ Read limit from system_settings table (default 2)
        $maxClubs = (int) (\App\Models\SystemSetting::where('key', 'max_clubs_per_student')->value('value') ?? 2);
        if ($clubCount >= $maxClubs) return response()->json(['message' => 'You can only join a maximum of ' . $maxClubs . ' clubs.'], 422);

        ClubMember::create(['club_id' => $club->id, 'user_id' => $request->user()->id, 'status' => 'active']);

        // ── NOTIFICATION: notify all club staff ──
        NotificationService::memberJoined($club->id, $request->user()->name);

        return response()->json(['message' => 'You have successfully joined ' . $club->name . '!', 'club_name' => $club->name]);
    }
}