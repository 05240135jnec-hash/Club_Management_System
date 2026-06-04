<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubAdvisor;
use App\Models\User;
use Illuminate\Http\Request;

class InviteAdvisorController extends Controller
{
    // ── GET available co-advisors ──
    public function available(Request $request)
    {
        $search = $request->query('search', '');
        $user   = $request->user();
        $club   = $this->getClub($user);

        if (!$club) {
            return response()->json(['co_advisors' => []]);
        }

        // Exclude advisors of ALL clubs
        $advisorIds = Club::pluck('advisor_id')->filter()->toArray();

        // Exclude secretaries of ALL clubs
        $secretaryIds = \App\Models\ClubMember::where('role', 'secretary')
            ->where('status', 'active')
            ->pluck('user_id')->toArray();

        // Exclude existing co-advisors of ALL clubs
        $coAdvisorIds = ClubAdvisor::pluck('user_id')->toArray();

        $excludeIds = array_unique(array_merge($advisorIds, $secretaryIds, $coAdvisorIds));

        $query = User::whereNotIn('id', $excludeIds)
            ->where('status', 'active')
            ->whereNotIn('role', ['super_admin']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $coAdvisors = $query->get()->map(fn($u) => [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'department' => $u->department ?? '—',
        ]);

        return response()->json(['co_advisors' => $coAdvisors]);
    }

    // ── POST add co-advisor directly to club ──────────────────
    public function add(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        $club = $this->getClub($user);

        if (!$club) {
            return response()->json(['message' => 'You do not have a club.'], 403);
        }

        // Check already assigned
        $alreadyAssigned = ClubAdvisor::where('user_id', $request->user_id)->exists();
        if ($alreadyAssigned) {
            return response()->json(['message' => 'This co-advisor is already assigned to a club.'], 409);
        }

        $coAdvisor = User::find($request->user_id);
        if (!$coAdvisor) {
            return response()->json(['message' => 'User not found.'], 422);
        }

        // Update role to co_advisor
        $coAdvisor->update(['role' => 'co_advisor']);

        ClubAdvisor::create([
            'club_id' => $club->id,
            'user_id' => $request->user_id,
            'is_main' => false,
        ]);

        // Send email to co-advisor
        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($coAdvisor, $club) {
                $loginUrl = config('app.url') . '/login';
                $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e;'>
                    <p style='font-size: 15px; margin-bottom: 12px;'>Dear {$coAdvisor->name},</p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 12px;'>
                        You have been assigned as the Co-Advisor for <strong>{$club->name}</strong> at JNEC Club Management System.
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
                $message->to($coAdvisor->email, $coAdvisor->name)
                    ->subject('You have been assigned as Co-Advisor')
                    ->html($html);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Co-advisor email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => $coAdvisor->name . ' has been added as co-advisor.',
        ]);
    }

    // ── GET all active co-advisors of advisor's club ──────────
    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);

        if (!$club) {
            return response()->json(['message' => 'No club found.'], 404);
        }

        $coAdvisors = ClubAdvisor::where('club_id', $club->id)
            ->where('is_main', false)
            ->with('user:id,name,email')
            ->get()
            ->map(fn($ca) => [
                'id'         => $ca->id,
                'name'       => $ca->user->name  ?? '—',
                'email'      => $ca->user->email ?? '—',
                'user_id'    => $ca->user_id,
                'created_at' => $ca->created_at->format('M d, Y'),
            ]);

        return response()->json([
            'invitations' => [], // kept for compatibility
            'co_advisors' => $coAdvisors,
        ]);
    }

    // ── Revoke co-advisor ─────────────────────────────────────
    public function revoke(Request $request, $userId)
    {
        $user = $request->user();
        $club = $this->getClub($user);

        if (!$club) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $clubAdvisor = ClubAdvisor::where('club_id', $club->id)
            ->where('user_id', $userId)
            ->where('is_main', false)
            ->first();

        if (!$clubAdvisor) {
            return response()->json(['message' => 'Co-advisor not found.'], 404);
        }

        $clubAdvisor->delete();

        // Revert role back to student
        $removedUser = User::find($userId);
        if ($removedUser) $removedUser->update(['role' => 'student']);

        return response()->json(['message' => 'Co-advisor removed successfully.']);
    }

    // ── Helper: get club ──────────────────────────────────────
    private function getClub($user)
    {
        if ($user->role === 'advisor') {
            return Club::where('advisor_id', $user->id)->first();
        }

        if ($user->role === 'co_advisor') {
            $clubAdvisor = ClubAdvisor::where('user_id', $user->id)
                ->where('is_main', false)
                ->first();
            return $clubAdvisor ? Club::find($clubAdvisor->club_id) : null;
        }

        return null;
    }
}