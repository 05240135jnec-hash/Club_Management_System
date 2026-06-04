<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClubMember;
use App\Models\Club;
use App\Models\ClubAdvisor;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class SecretaryController extends Controller
{
    private function getAdvisorClub($user)
    {
        if ($user->role === 'advisor') {
            return Club::where('advisor_id', $user->id)->first();
        }
        if ($user->role === 'co_advisor') {
            $ca = ClubAdvisor::where('user_id', $user->id)->where('is_main', false)->first();
            return $ca ? Club::find($ca->club_id) : null;
        }
        return null;
    }

    // ── GET secretary's own club ──
    public function myClub(Request $request)
    {
        $user = $request->user();

        // Find the club where this user is secretary
        $member = ClubMember::where('user_id', $user->id)
            ->where('role', 'secretary')
            ->where('status', 'active')
            ->first();

        // Fallback: any active membership
        if (!$member) {
            $member = ClubMember::where('user_id', $user->id)
                ->where('status', 'active')
                ->first();
        }

        if (!$member) {
            return response()->json(['message' => 'Club not found.'], 404);
        }

        $club = Club::find($member->club_id);
        if (!$club) {
            return response()->json(['message' => 'Club not found.'], 404);
        }

        return response()->json([
            'id'           => $club->id,
            'name'         => $club->name,
            'blog_enabled' => (bool) $club->blog_enabled,
        ]);
    }

    // ── GET available users to assign as secretary ──
    // Only enrolled members of THIS club
    // Anyone already secretary of ANY club is excluded
    public function availableUsers(Request $request)
    {
        $user = $request->user();
        $club = $this->getAdvisorClub($user);
        if (!$club) return response()->json(['users' => []]);

        $search = $request->query('search', '');

        // Only members enrolled in THIS club
        $memberUserIds = ClubMember::where('club_id', $club->id)
            ->where('status', 'active')
            ->pluck('user_id')
            ->toArray();

        // Exclude advisors of ANY club
        $advisorIds = Club::pluck('advisor_id')->filter()->toArray();

        // Exclude co-advisors of ANY club
        $coAdvisorIds = ClubAdvisor::pluck('user_id')->toArray();

        // Exclude anyone who is ALREADY secretary of ANY club
        $anySecretaryIds = ClubMember::where('role', 'secretary')
            ->where('status', 'active')
            ->pluck('user_id')
            ->toArray();

        $excludeIds = array_unique(array_merge($advisorIds, $coAdvisorIds, $anySecretaryIds));

        $query = User::whereIn('id', $memberUserIds)
            ->whereNotIn('id', $excludeIds)
            ->where('status', 'active');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->get()->map(fn($u) => [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'student_id' => $u->student_id ?? '—',
            'department' => $u->department ?? '—',
        ]);

        return response()->json(['users' => $users]);
    }

    // ── GET all members of advisor's club ──
    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getAdvisorClub($user);

        if (!$club) {
            return response()->json(['message' => 'Club not found.'], 404);
        }

        $members = ClubMember::where('club_id', $club->id)
            ->where('status', '!=', 'removed')
            ->with('user')
            ->get()
            ->map(function ($m) {
                return [
                    'id'         => $m->user->id,
                    'name'       => $m->user->name,
                    'student_id' => $m->user->student_id,
                    'course'     => $m->user->course,
                    'role'       => $m->role,
                ];
            });

        return response()->json([
            'club_id' => $club->id,
            'members' => $members,
        ]);
    }

    // ── ASSIGN secretary ──
    public function assign(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['advisor', 'co_advisor'])) {
            return response()->json(['message' => 'Only advisors can assign secretaries.'], 403);
        }

        $request->validate(['user_id' => 'required|exists:users,id']);

        $club = $this->getAdvisorClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        // Max 2 secretaries per club
        $secretaryCount = ClubMember::where('club_id', $club->id)
            ->where('role', 'secretary')
            ->where('status', 'active')
            ->count();

        if ($secretaryCount >= 2) {
            return response()->json(['message' => 'Maximum 2 secretaries allowed per club.'], 422);
        }

        // ── BLOCK if already secretary of ANY club ──
        $alreadySecretary = ClubMember::where('user_id', $request->user_id)
            ->where('role', 'secretary')
            ->where('status', 'active')
            ->exists();

        if ($alreadySecretary) {
            return response()->json([
                'message' => 'This person is already a secretary of another club. A member can only be secretary of one club at a time.'
            ], 422);
        }

        $targetUser = User::find($request->user_id);

        // Must be enrolled in this club
        $target = ClubMember::where('club_id', $club->id)
            ->where('user_id', $request->user_id)
            ->first();

        if (!$target) {
            return response()->json(['message' => 'This user is not a member of this club.'], 422);
        }

        if ($target->role === 'secretary') {
            return response()->json(['message' => 'This member is already a secretary of this club.'], 422);
        }

        // Update club_members role
        $target->role = 'secretary';
        $target->save();

        // Update users.role
        $targetUser->role = 'secretary';
        $targetUser->save();

        NotificationService::secretaryAssigned($club->id, $request->user_id, $targetUser->name);

        // Send email to secretary
        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($targetUser, $club) {
                $loginUrl = config('app.url') . '/login';
                $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e;'>
                    <p style='font-size: 15px; margin-bottom: 12px;'>Dear {$targetUser->name},</p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 12px;'>
                        You have been assigned as the Secretary for <strong>{$club->name}</strong> at JNEC Club Management System.
                    </p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 24px;'>
                        Please login to the system to access your club.
                    </p>
                    <p style='font-size: 15px; margin-bottom: 4px;'>Regards,</p>
                    <p style='font-size: 15px; font-weight: bold; margin-bottom: 32px;'>JNEC Club Management</p>
                    <div style='text-align: right;'>
                        <a href='{$loginUrl}' style='background-color: #172D3D; color: #c9a84c; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;'>Click here to login</a>
                    </div>
                </div>";
                $message->to($targetUser->email, $targetUser->name)
                    ->subject('You have been assigned as Secretary')
                    ->html($html);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Secretary email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Secretary assigned successfully.',
            'member'  => [
                'id'         => $targetUser->id,
                'name'       => $targetUser->name,
                'student_id' => $targetUser->student_id,
                'course'     => $targetUser->course,
                'role'       => 'secretary',
            ],
        ]);
    }

    // ── REMOVE secretary ──
    public function remove(Request $request, $userId)
    {
        $user = $request->user();
        if (!in_array($user->role, ['advisor', 'co_advisor'])) {
            return response()->json(['message' => 'Only advisors can remove secretaries.'], 403);
        }

        $club = $this->getAdvisorClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $target = ClubMember::where('club_id', $club->id)
            ->where('user_id', $userId)
            ->first();

        if (!$target || $target->role !== 'secretary') {
            return response()->json(['message' => 'This user is not a secretary of this club.'], 404);
        }

        // Downgrade club_members role
        $target->role = 'member';
        $target->save();

        // Downgrade users.role
        $targetUser = User::find($userId);
        $targetUser->role = 'member';
        $targetUser->save();

        return response()->json(['message' => 'Secretary removed successfully.']);
    }
}