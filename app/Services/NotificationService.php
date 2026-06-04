<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Club;
use App\Models\ClubAdvisor;
use App\Models\ClubMember;
use App\Models\User;

class NotificationService
{
    // ── Helper: get all staff user_ids for a club ─────────────
    // Returns advisor + co-advisors + secretaries
    public static function getClubStaffIds($clubId, $excludeUserId = null)
    {
        $club = Club::find($clubId);
        if (!$club) return [];

        $ids = [];

        // Main advisor
        if ($club->advisor_id) $ids[] = $club->advisor_id;

        // Co-advisors
        $coAdvisorIds = ClubAdvisor::where('club_id', $clubId)
            ->where('is_main', false)
            ->pluck('user_id')
            ->toArray();
        $ids = array_merge($ids, $coAdvisorIds);

        // Secretaries
        $secretaryIds = ClubMember::where('club_id', $clubId)
            ->where('status', 'active')
            ->where('role', 'secretary')
            ->pluck('user_id')
            ->toArray();
        $ids = array_merge($ids, $secretaryIds);

        // Remove duplicates and excluded user
        $ids = array_unique($ids);
        if ($excludeUserId) {
            $ids = array_filter($ids, fn($id) => $id != $excludeUserId);
        }

        return array_values($ids);
    }

    // ── Helper: get advisor + co-advisor ids only ─────────────
    public static function getAdvisorIds($clubId, $excludeUserId = null)
    {
        $club = Club::find($clubId);
        if (!$club) return [];

        $ids = [];
        if ($club->advisor_id) $ids[] = $club->advisor_id;

        $coAdvisorIds = ClubAdvisor::where('club_id', $clubId)
            ->where('is_main', false)
            ->pluck('user_id')
            ->toArray();
        $ids = array_merge($ids, $coAdvisorIds);

        $ids = array_unique($ids);
        if ($excludeUserId) {
            $ids = array_filter($ids, fn($id) => $id != $excludeUserId);
        }

        return array_values($ids);
    }

    // ── Helper: create notification for multiple users ────────
    public static function send(array $userIds, string $type, string $title, string $message, string $clubName = '')
    {
        foreach ($userIds as $userId) {
            Notification::create([
                'user_id'   => $userId,
                'type'      => $type,
                'title'     => $title,
                'message'   => $message,
                'club_name' => $clubName,
                'is_read'   => false,
            ]);
        }
    }

    // ════════════════════════════════════════════════════════
    // NOTIFICATION TRIGGERS
    // ════════════════════════════════════════════════════════

    // 1. Co-advisor accepted invite
    public static function coAdvisorAccepted($clubId, $coAdvisorName, $advisorId)
    {
        $club = Club::find($clubId);
        self::send(
            [$advisorId],
            'co_advisor_accepted',
            'Co-Advisor Joined',
            "{$coAdvisorName} has accepted your co-advisor invitation and joined {$club->name}.",
            $club->name ?? ''
        );
    }

    // 2. Announcement posted — notify all staff except poster
    public static function announcementPosted($clubId, $posterName, $announcementTitle, $posterId)
    {
        $club    = Club::find($clubId);
        $staffIds = self::getClubStaffIds($clubId, $posterId);
        self::send(
            $staffIds,
            'announcement',
            'New Announcement Posted',
            "{$posterName} posted a new announcement: \"{$announcementTitle}\"",
            $club->name ?? ''
        );
    }

    // 3. Secretary submitted report — notify advisors
    public static function reportSubmitted($clubId, $secretaryName, $reportTitle)
    {
        $club       = Club::find($clubId);
        $advisorIds = self::getAdvisorIds($clubId);
        self::send(
            $advisorIds,
            'report',
            'New Report Submitted',
            "Secretary {$secretaryName} submitted a new report: \"{$reportTitle}\"",
            $club->name ?? ''
        );
    }

    // 4. Attendance clash — notify both clubs
    public static function attendanceClash($studentName, $studentId, $club1Id, $club2Id)
    {
        $club1 = Club::find($club1Id);
        $club2 = Club::find($club2Id);

        // Notify club1 staff
        $club1Staff = self::getClubStaffIds($club1Id);
        self::send(
            $club1Staff,
            'attendance_clash',
            'Attendance Clash Detected',
            "⚠️ {$studentName} ({$studentId}) is already marked present at {$club2->name} today.",
            $club1->name ?? ''
        );

        // Notify club2 staff
        $club2Staff = self::getClubStaffIds($club2Id);
        self::send(
            $club2Staff,
            'attendance_clash',
            'Attendance Clash Detected',
            "⚠️ {$studentName} ({$studentId}) is also being marked present at {$club1->name} today.",
            $club2->name ?? ''
        );
    }

    // 5. New member joined — notify all staff
    public static function memberJoined($clubId, $memberName)
    {
        $club     = Club::find($clubId);
        $staffIds = self::getClubStaffIds($clubId);
        self::send(
            $staffIds,
            'member_joined',
            'New Member Joined',
            "{$memberName} joined {$club->name} using the enrollment key.",
            $club->name ?? ''
        );
    }

    // 6. Secretary assigned — notify the secretary
    public static function secretaryAssigned($clubId, $secretaryUserId, $secretaryName)
    {
        $club = Club::find($clubId);
        self::send(
            [$secretaryUserId],
            'secretary_assigned',
            'You Are Now a Secretary',
            "You have been assigned as Club Secretary for {$club->name}.",
            $club->name ?? ''
        );
    }

    // 7. Work plan uploaded by secretary — notify advisors
    public static function workPlanUploaded($clubId, $secretaryName, $planTitle)
    {
        $club       = Club::find($clubId);
        $advisorIds = self::getAdvisorIds($clubId);
        self::send(
            $advisorIds,
            'work_plan',
            'New Work Plan Uploaded',
            "Secretary {$secretaryName} uploaded a new work plan: \"{$planTitle}\"",
            $club->name ?? ''
        );
    }

    // 8. Audit feedback submitted — notify advisor + secretary who uploaded
    public static function auditFeedbackSubmitted($clubId, $reportTitle, $uploaderId)
    {
        $club = Club::find($clubId);
        self::send(
            [$uploaderId],
            'audit_feedback',
            'New Audit Feedback',
            "A student submitted feedback on your audit report: \"{$reportTitle}\"",
            $club->name ?? ''
        );
    }

    // 9. Report forwarded to DSA — notify super admin
    public static function reportForwardedToDSA($clubName, $uploaderName, $reportTitle)
    {
        // Get super admin user
        $superAdmin = \App\Models\User::where('role', 'super_admin')->first();
        if (!$superAdmin) return;

        self::send(
            [$superAdmin->id],
            'report',
            'New Report Submitted to DSA',
            "{$uploaderName} from {$clubName} submitted a report: \"{$reportTitle}\"",
            $clubName
        );
    }
}