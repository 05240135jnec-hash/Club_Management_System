<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CertificateController extends Controller
{
    public function studentEligibility(Request $request, $clubId)
    {
        $user = $request->user();
        $club = Club::find($clubId);

        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $member = ClubMember::where('club_id', $clubId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (!$member) return response()->json(['message' => 'You are not a member of this club.'], 403);

        // Attendance calculation
        $totalSessions = AttendanceSession::where('club_id', $clubId)->count();
        $attendancePct = 0;
        if ($totalSessions > 0) {
            $absentCount   = AttendanceRecord::where('user_id', $user->id)
                ->where('status', 'absent')
                ->whereHas('session', fn($q) => $q->where('club_id', $clubId))
                ->count();
            $attendancePct = round((($totalSessions - $absentCount) / $totalSessions) * 100);
        }

        // System settings
        $certEnabled = SystemSetting::where('key', 'certificate_enabled')->first();
        $globalEnabled = $certEnabled ? (bool) $certEnabled->value : false;

        $minSessionsSetting = SystemSetting::where('key', 'min_sessions_for_cert')->first();
        $minSessions = $minSessionsSetting ? (int) $minSessionsSetting->value : 5;

        // Club has enough sessions?
        $clubHasEnoughSessions = $totalSessions >= $minSessions;

        // Year check
        $year = $user->year ?? '';
        $yearNum = (int) preg_replace('/\D/', '', $year);
        $isGraduating = in_array($yearNum, [2, 4]);

        // Signatures
        $advisorUser   = User::find($club->advisor_id);
        $advisorSig    = $advisorUser?->signature ?? null;
        $superAdmin    = User::where('role', 'super_admin')->first();
        $superAdminSig = $superAdmin?->signature ?? null;

        $joinedAt = $member->created_at
            ? Carbon::parse($member->created_at)->format('F Y') : '—';

        // Template URL
        $templateSetting = SystemSetting::where('key', 'certificate_template')->first();
        $templateUrl = null;
        if ($templateSetting && $templateSetting->value) {
            $templateUrl = asset('storage/' . $templateSetting->value);
        }

        return response()->json([
            'student_name'   => $user->name,
            'student_id'     => $user->student_id ?? '—',
            'club_name'      => $club->name,
            'year'           => $year,
            'from'           => $joinedAt,
            'to'             => Carbon::now()->format('F Y'),

            'attendance_pct'   => $attendancePct,
            'total_sessions'   => $totalSessions,
            'min_sessions'     => $minSessions,

            'is_graduating'            => $isGraduating,
            'cert_enabled'             => $globalEnabled,
            'club_has_enough_sessions' => $clubHasEnoughSessions,
            'has_advisor_sig'          => !empty($advisorSig),
            'has_super_admin_sig'      => !empty($superAdminSig),

            'advisor_signature'        => $advisorSig,
            'super_admin_signature'    => $superAdminSig,
            'advisor_name'             => $advisorUser?->name ?? '—',
            'super_admin_name'         => $superAdmin?->name ?? '—',

            'certificate_template_url' => $templateUrl,

            'eligible' => $globalEnabled && $clubHasEnoughSessions && $isGraduating && $attendancePct >= 90 && !empty($advisorSig) && !empty($superAdminSig),
        ]);
    }

    public function secretaryEligibility(Request $request)
    {
        $user = $request->user();

        $member = ClubMember::where('user_id', $user->id)
            ->where('status', 'active')
            ->where('role', 'secretary')
            ->first();

        if (!$member) return response()->json(['message' => 'You are not assigned as secretary.'], 403);

        $club = Club::find($member->club_id);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        // System settings
        $certEnabled   = SystemSetting::where('key', 'certificate_enabled')->first();
        $globalEnabled = $certEnabled ? (bool) $certEnabled->value : false;

        $minSessionsSetting = SystemSetting::where('key', 'min_sessions_for_cert')->first();
        $minSessions = $minSessionsSetting ? (int) $minSessionsSetting->value : 5;

        $totalSessions = AttendanceSession::where('club_id', $club->id)->count();
        $clubHasEnoughSessions = $totalSessions >= $minSessions;

        // Signatures
        $advisorUser   = User::find($club->advisor_id);
        $advisorSig    = $advisorUser?->signature ?? null;
        $superAdmin    = User::where('role', 'super_admin')->first();
        $superAdminSig = $superAdmin?->signature ?? null;

        $joinedAt = $member->created_at
            ? Carbon::parse($member->created_at)->format('F Y') : '—';

        // Template URL
        $templateSetting = SystemSetting::where('key', 'certificate_template')->first();
        $templateUrl = null;
        if ($templateSetting && $templateSetting->value) {
            $templateUrl = asset('storage/' . $templateSetting->value);
        }

        return response()->json([
            'student_name' => $user->name,
            'student_id'   => $user->student_id ?? '—',
            'club_name'    => $club->name,
            'year'         => $user->year ?? '—',
            'from'         => $joinedAt,
            'to'           => Carbon::now()->format('F Y'),
            'role_label'   => $club->name . ' Secretary',

            'cert_enabled'             => $globalEnabled,
            'club_has_enough_sessions' => $clubHasEnoughSessions,
            'total_sessions'           => $totalSessions,
            'min_sessions'             => $minSessions,
            'has_advisor_sig'          => !empty($advisorSig),
            'has_super_admin_sig'      => !empty($superAdminSig),

            'advisor_signature'        => $advisorSig,
            'super_admin_signature'    => $superAdminSig,
            'advisor_name'             => $advisorUser?->name ?? '—',
            'super_admin_name'         => $superAdmin?->name ?? '—',

            'certificate_template_url' => $templateUrl,

            'eligible' => $globalEnabled && $clubHasEnoughSessions && !empty($advisorSig) && !empty($superAdminSig),
        ]);
    }
}