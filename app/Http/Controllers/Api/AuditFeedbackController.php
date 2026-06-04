<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditFeedback;
use App\Models\Report;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class AuditFeedbackController extends Controller
{
    public function store(Request $request, $reportId)
    {
        $user   = $request->user();
        $report = Report::where('id', $reportId)->where('is_audit', true)->first();
        if (!$report) return response()->json(['message' => 'Audit report not found.'], 404);

        $request->validate(['feedback' => 'required|string']);

        $existing = AuditFeedback::where('report_id', $reportId)->where('user_id', $user->id)->first();
        if ($existing) return response()->json(['message' => 'You have already submitted feedback for this report.'], 422);

        $feedback = AuditFeedback::create(['report_id' => $reportId, 'user_id' => $user->id, 'feedback' => $request->feedback]);

        // ── NOTIFICATION: notify the uploader of the audit report ──
        NotificationService::auditFeedbackSubmitted($report->club_id, $report->title, $report->uploaded_by);

        return response()->json(['message' => 'Feedback submitted successfully.', 'feedback' => ['id' => $feedback->id, 'feedback' => $feedback->feedback, 'user_name' => $user->name, 'created_at' => $feedback->created_at->format('M d, Y')]], 201);
    }

    public function index(Request $request, $reportId)
    {
        $user   = $request->user();
        $report = Report::where('id', $reportId)->where('is_audit', true)->first();
        if (!$report) return response()->json(['message' => 'Audit report not found.'], 404);
        if ($report->uploaded_by != $user->id) return response()->json(['message' => 'Unauthorized.'], 403);

        $feedbacks = AuditFeedback::where('report_id', $reportId)->with('user:id,name,role')->orderBy('created_at', 'desc')->get()
            ->map(fn($f) => ['id' => $f->id, 'feedback' => $f->feedback, 'user_name' => $f->user->name ?? '—', 'user_role' => $f->user->role ?? '—', 'created_at' => $f->created_at->format('M d, Y')]);

        return response()->json(['feedbacks' => $feedbacks, 'total' => $feedbacks->count()]);
    }
}