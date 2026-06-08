<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Club;
use App\Models\ClubMember;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    private function formatSize($bytes)
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        return round($bytes / 1024, 1) . ' KB';
    }

    private function formatReport($report)
    {
        return [
            'id'               => $report->id,
            'title'            => $report->title,
            'type'             => $report->type,
            'file_name'        => $report->file_name,
            'file_size'        => $report->file_size,
            'file_url'         => asset('storage/' . $report->file_path),
            'sent_to'          => $report->sent_to,
            'role'             => $report->role,
            'is_audit'         => $report->is_audit,
            'forwarded_to_dsa' => $report->forwarded_to_dsa,
            'forwarded_at'     => $report->forwarded_at ? $report->forwarded_at->format('M d, Y h:i A') : null,
            'uploaded_by'      => $report->uploader->name ?? '—',
            'club_name'        => $report->club->name ?? '—',
            'created_at'       => $report->created_at->format('M d, Y'),
        ];
    }

    private function getUserClub($user)
    {
        if ($user->role === 'advisor') return Club::where('advisor_id', $user->id)->first();
        if ($user->role === 'co_advisor') {
            $ca = \App\Models\ClubAdvisor::where('user_id', $user->id)->where('is_main', false)->first();
            return $ca ? Club::find($ca->club_id) : null;
        }
        if ($user->role === 'secretary') {
            $member = ClubMember::where('user_id', $user->id)->where('status', 'active')->where('role', 'secretary')->first();
            if (!$member) {
                $member = ClubMember::where('user_id', $user->id)->where('status', 'active')->first();
            }
            return $member ? Club::find($member->club_id) : null;
        }
        return null;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $query = Report::where('club_id', $club->id)->with(['uploader:id,name', 'club:id,name']);

        if ($user->role === 'secretary') {
            $query->where('uploaded_by', $user->id);
        } else if ($user->role === 'advisor') {
            $query->where(function($q) use ($user) {
                $q->where('uploaded_by', $user->id)
                  ->orWhere(function($q2) {
                      $q2->where('role', 'secretary')->where('sent_to', 'advisor')->where('is_audit', false);
                  });
            });
        }

        $reports = $query->orderBy('created_at', 'desc')->get()->map(fn($r) => $this->formatReport($r));

        return response()->json([
            'reports'              => $reports,
            'total'                => $reports->count(),
            'audit_report_enabled' => (bool) $club->audit_report_enabled,
            'blog_enabled'         => (bool) $club->blog_enabled,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $isAudit = $request->boolean('is_audit', false);
        if ($isAudit && !$club->audit_report_enabled) return response()->json(['message' => 'Audit report feature is not enabled for your club.'], 403);

        $request->validate([
            'title'    => 'required|string|max:255',
            'type'     => 'required|string|max:100',
            'sent_to'  => 'required_unless:is_audit,true|in:dsa,me,advisor',
            'is_audit' => 'boolean',
            'file'     => 'required|file|mimes:pdf,doc,docx,xls,xlsx',
        ]);

        $file = $request->file('file');
        $report = Report::create([
            'club_id'          => $club->id,
            'uploaded_by'      => $user->id,
            'role'             => $user->role,
            'title'            => $request->title,
            'type'             => $request->type,
            'file_path'        => $file->store('reports', 'public'),
            'file_name'        => $file->getClientOriginalName(),
            'file_size'        => $this->formatSize($file->getSize()),
            'is_audit'         => $isAudit,
            'sent_to'          => $isAudit ? 'dsa' : ($request->sent_to === 'advisor' ? 'me' : $request->sent_to),
            'forwarded_to_dsa' => $isAudit ? true : ($request->sent_to === 'dsa'),
            'forwarded_at'     => ($isAudit || $request->sent_to === 'dsa') ? now() : null,
        ]);

        if ($user->role === 'secretary') {
            NotificationService::reportSubmitted($club->id, $user->name, $request->title);
        }
        if ($report->forwarded_to_dsa) {
            NotificationService::reportForwardedToDSA($club->name, $user->name, $request->title);
        }

        return response()->json(['message' => 'Report uploaded successfully.', 'report' => $this->formatReport($report->load(['uploader', 'club']))], 201);
    }

    public function secretaryStore(Request $request)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'You are not assigned to any club.'], 403);

        $isAudit = $request->boolean('is_audit', false);
        if ($isAudit && !$club->audit_report_enabled) return response()->json(['message' => 'Audit report feature is not enabled for your club.'], 403);

        $request->validate([
            'title'    => 'required|string|max:255',
            'type'     => 'required|string|max:100',
            'sent_to'  => 'required_unless:is_audit,true|in:dsa,me,advisor',
            'is_audit' => 'boolean',
            'file'     => 'required|file|mimes:pdf,doc,docx,xls,xlsx',
        ]);

        $file = $request->file('file');
        $report = Report::create([
            'club_id'          => $club->id,
            'uploaded_by'      => $user->id,
            'role'             => 'secretary',
            'title'            => $request->title,
            'type'             => $request->type,
            'file_path'        => $file->store('reports', 'public'),
            'file_name'        => $file->getClientOriginalName(),
            'file_size'        => $this->formatSize($file->getSize()),
            'is_audit'         => $isAudit,
            'sent_to'          => $isAudit ? 'dsa' : $request->sent_to,
            'forwarded_to_dsa' => $isAudit ? true : false,
            'forwarded_at'     => $isAudit ? now() : null,
        ]);

        NotificationService::reportSubmitted($club->id, $user->name, $request->title);
        if ($report->forwarded_to_dsa) {
            NotificationService::reportForwardedToDSA($club->name, $user->name, $request->title);
        }

        return response()->json(['message' => 'Report uploaded successfully.', 'report' => $this->formatReport($report->load(['uploader', 'club']))], 201);
    }

    public function forward(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $report = Report::where('id', $id)->where('club_id', $club->id)->first();
        if (!$report) return response()->json(['message' => 'Report not found.'], 404);
        if ($report->forwarded_to_dsa) return response()->json(['message' => 'Report already forwarded to DSA.'], 422);

        $report->update(['forwarded_to_dsa' => true, 'sent_to' => 'dsa', 'forwarded_at' => now()]);

        NotificationService::reportForwardedToDSA($report->club->name ?? $club->name, $user->name, $report->title);

        return response()->json(['message' => 'Report forwarded to DSA successfully.', 'report' => $this->formatReport($report->load(['uploader', 'club']))]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $report = Report::where('id', $id)->where('club_id', $club->id)->first();
        if (!$report) return response()->json(['message' => 'Report not found.'], 404);

        $request->validate(['title' => 'required|string|max:255', 'type' => 'required|string|max:100', 'sent_to' => 'nullable|in:dsa,me,advisor']);
        $report->update(['title' => $request->title, 'type' => $request->type, 'sent_to' => $report->is_audit ? 'dsa' : ($request->sent_to ?? $report->sent_to)]);

        return response()->json(['message' => 'Report updated successfully.', 'report' => $this->formatReport($report->load(['uploader', 'club']))]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getUserClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $report = Report::where('id', $id)->where('club_id', $club->id)->first();
        if (!$report) return response()->json(['message' => 'Report not found.'], 404);

        Storage::disk('public')->delete($report->file_path);
        $report->delete();

        return response()->json(['message' => 'Report deleted successfully.']);
    }

    public function dsaIndex(Request $request)
    {
        $reports = Report::where('forwarded_to_dsa', true)->where('is_audit', false)
            ->with(['uploader:id,name', 'club:id,name'])->orderBy('forwarded_at', 'desc')->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'title'        => $r->title,
                'type'         => $r->type,
                'file_name'    => $r->file_name,
                'file_size'    => $r->file_size,
                'file_url'     => asset('storage/' . $r->file_path),
                'club_name'    => $r->club->name ?? '—',
                'uploaded_by'  => $r->uploader->name ?? '—',
                'role'         => $r->role,
                'forwarded_at' => $r->forwarded_at ? $r->forwarded_at->format('M d, Y h:i A') : null,
                'created_at'   => $r->created_at->format('M d, Y'),
            ]);

        return response()->json(['reports' => $reports, 'total' => $reports->count()]);
    }

    public function auditIndex(Request $request)
    {
        $reports = Report::where('is_audit', true)
            ->whereHas('club', fn($q) => $q->where('audit_report_enabled', true))
            ->with(['uploader:id,name', 'club:id,name'])->orderBy('created_at', 'desc')->get()
            ->map(fn($r) => [
                'id'          => $r->id,
                'title'       => $r->title,
                'type'        => $r->type,
                'file_name'   => $r->file_name,
                'file_size'   => $r->file_size,
                'file_url'    => asset('storage/' . $r->file_path),
                'club_name'   => $r->club->name ?? '—',
                'uploaded_by' => $r->uploader->name ?? '—',
                'created_at'  => $r->created_at->format('M d, Y'),
            ]);

        return response()->json(['reports' => $reports, 'total' => $reports->count()]);
    }
}