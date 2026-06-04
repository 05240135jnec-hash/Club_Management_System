<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\ClubAdvisor;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    private function getUserClub($user)
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
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $sessions = AttendanceSession::where('club_id', $club->id)
            ->with(['createdBy:id,name', 'updatedBy:id,name'])
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($session) use ($club) {
                $activeUserIds = ClubMember::where('club_id', $club->id)->where('status', '!=', 'removed')->pluck('user_id');
                $totalMembers  = $activeUserIds->count();
                $absentCount   = AttendanceRecord::where('session_id', $session->id)->where('status', 'absent')->whereIn('user_id', $activeUserIds)->count();
                $presentCount = $totalMembers - $absentCount;
                $pct          = $totalMembers > 0 ? round(($presentCount / $totalMembers) * 100) : 0;

                return [
                    'id'            => $session->id,
                    'name'          => $session->name,
                    'date'          => $session->date,
                    'total_members' => $totalMembers,
                    'present'       => $presentCount,
                    'absent'        => $absentCount,
                    'percentage'    => $pct,
                    'created_by'    => $session->createdBy->name ?? '—',
                    'updated_by'    => $session->updatedBy->name ?? null,
                ];
            });

        return response()->json(['club_id' => $club->id, 'sessions' => $sessions]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $session = AttendanceSession::where('id', $id)->where('club_id', $club->id)->first();
        if (!$session) return response()->json(['message' => 'Session not found.'], 404);

        $members = ClubMember::where('club_id', $club->id)->where('status', '!=', 'removed')
            ->with('user')->get()
            ->map(function ($m) use ($session, $club) {
                $record = AttendanceRecord::where('session_id', $session->id)->where('user_id', $m->user->id)->first();
                $status = $record ? $record->status : 'present';

                $totalSessions   = AttendanceSession::where('club_id', $club->id)->count();
                $absentSessions  = AttendanceRecord::where('user_id', $m->user->id)->where('status', 'absent')
                    ->whereHas('session', fn($q) => $q->where('club_id', $club->id))->count();
                $presentSessions = $totalSessions - $absentSessions;
                $overallPct      = $totalSessions > 0 ? round(($presentSessions / $totalSessions) * 100) : 0;

                return [
                    'id'         => $m->user->id,
                    'name'       => $m->user->name,
                    'student_id' => $m->user->student_id,
                    'email'      => $m->user->email,
                    'course'     => $m->user->course,
                    'year'       => $m->user->year,
                    'status'     => $status,
                    'overall_pct'=> $overallPct,
                ];
            });

        return response()->json([
            'session' => [
                'id'         => $session->id,
                'name'       => $session->name,
                'date'       => $session->date,
                'created_by' => $session->createdBy->name ?? '—',
                'updated_by' => $session->updatedBy->name ?? null,
            ],
            'members' => $members,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $request->validate(['name' => 'required|string|max:255', 'date' => 'required|date']);

        $exists = AttendanceSession::where('club_id', $club->id)->where('date', $request->date)->first();
        if ($exists) return response()->json(['message' => 'A session already exists for this date.'], 422);

        $session      = AttendanceSession::create(['club_id' => $club->id, 'name' => $request->name, 'date' => $request->date, 'created_by' => $user->id]);
        $totalMembers = ClubMember::where('club_id', $club->id)->where('status', '!=', 'removed')->count();

        return response()->json([
            'message' => 'Session created successfully.',
            'session' => [
                'id'            => $session->id,
                'name'          => $session->name,
                'date'          => $session->date,
                'total_members' => $totalMembers,
                'present'       => $totalMembers,
                'absent'        => 0,
                'percentage'    => $totalMembers > 0 ? 100 : 0,
                'created_by'    => $user->name,
                'updated_by'    => null,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $session = AttendanceSession::where('id', $id)->where('club_id', $club->id)->first();
        if (!$session) return response()->json(['message' => 'Session not found.'], 404);

        $request->validate(['name' => 'required|string|max:255', 'date' => 'required|date']);

        $exists = AttendanceSession::where('club_id', $club->id)->where('date', $request->date)->where('id', '!=', $id)->first();
        if ($exists) return response()->json(['message' => 'A session already exists for this date.'], 422);

        $session->name       = $request->name;
        $session->date       = $request->date;
        $session->updated_by = $user->id;
        $session->save();

        return response()->json([
            'message' => 'Session updated successfully.',
            'session' => [
                'id'         => $session->id,
                'name'       => $session->name,
                'date'       => $session->date,
                'created_by' => $session->createdBy->name ?? '—',
                'updated_by' => $user->name,
            ],
        ]);
    }

    public function save(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $session = AttendanceSession::where('id', $id)->where('club_id', $club->id)->first();
        if (!$session) return response()->json(['message' => 'Session not found.'], 404);

        $request->validate([
            'attendance'           => 'required|array',
            'attendance.*.user_id' => 'required|exists:users,id',
            'attendance.*.status'  => 'required|in:present,absent',
        ]);

        foreach ($request->attendance as $record) {
            AttendanceRecord::updateOrCreate(
                ['session_id' => $session->id, 'user_id' => $record['user_id']],
                ['status' => $record['status']]
            );
        }

        return response()->json(['message' => 'Attendance saved successfully.']);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'Club not found.'], 404);

        $session = AttendanceSession::where('id', $id)->where('club_id', $club->id)->first();
        if (!$session) return response()->json(['message' => 'Session not found.'], 404);

        $session->delete();
        return response()->json(['message' => 'Session deleted successfully.']);
    }
}