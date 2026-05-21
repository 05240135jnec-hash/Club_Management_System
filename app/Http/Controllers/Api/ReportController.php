<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    // ── Helper: format file size ──────────────────────────────────
    private function formatSize($bytes)
    {
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 1) . ' MB';
        }
        return round($bytes / 1024, 1) . ' KB';
    }

    // ── Helper: format report for response ───────────────────────
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
            'forwarded_to_dsa' => $report->forwarded_to_dsa,
            'forwarded_at'     => $report->forwarded_at
                                    ? $report->forwarded_at->format('M d, Y h:i A')
                                    : null,
            'uploaded_by'      => $report->uploader->name ?? '—',
            'created_at'       => $report->created_at->format('M d, Y'),
        ];
    }

    // ── GET all reports for advisor's club ────────────────────────
    public function index(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $reports = Report::where('club_id', $club->id)
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => $this->formatReport($r));

        return response()->json([
            'reports' => $reports,
            'total'   => $reports->count(),
        ]);
    }

    // ── POST upload new report (advisor only) ─────────────────────
    public function store(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $request->validate([
            'title'   => 'required|string|max:255',
            'type'    => 'required|string|max:100',
            'sent_to' => 'required|in:dsa,me',
            'file'    => 'required|file|mimes:pdf,doc,docx',
        ]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileSize = $this->formatSize($file->getSize());
        $filePath = $file->store('reports', 'public');

        $report = Report::create([
            'club_id'          => $club->id,
            'uploaded_by'      => $user->id,
            'role'             => 'advisor',
            'title'            => $request->title,
            'type'             => $request->type,
            'file_path'        => $filePath,
            'file_name'        => $fileName,
            'file_size'        => $fileSize,
            'sent_to'          => $request->sent_to,
            'forwarded_to_dsa' => $request->sent_to === 'dsa',
            'forwarded_at'     => $request->sent_to === 'dsa' ? now() : null,
        ]);

        return response()->json([
            'message' => 'Report uploaded successfully.',
            'report'  => $this->formatReport($report->load('uploader')),
        ], 201);
    }

    // ── POST upload by secretary ──────────────────────────────────
    public function secretaryStore(Request $request)
    {
        $user = $request->user();

        // Find club where this user is secretary
        $club = Club::where('secretary_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'You are not assigned as secretary to any club.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'type'  => 'required|string|max:100',
            'file'  => 'required|file|mimes:pdf,doc,docx',
        ]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileSize = $this->formatSize($file->getSize());
        $filePath = $file->store('reports', 'public');

        $report = Report::create([
            'club_id'          => $club->id,
            'uploaded_by'      => $user->id,
            'role'             => 'secretary',
            'title'            => $request->title,
            'type'             => $request->type,
            'file_path'        => $filePath,
            'file_name'        => $fileName,
            'file_size'        => $fileSize,
            'sent_to'          => 'me', // goes to advisor first
            'forwarded_to_dsa' => false,
        ]);

        return response()->json([
            'message' => 'Report submitted to advisor successfully.',
            'report'  => $this->formatReport($report->load('uploader')),
        ], 201);
    }

    // ── PUT forward report to DSA ─────────────────────────────────
    public function forward(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $report = Report::where('id', $id)
            ->where('club_id', $club->id)
            ->first();

        if (!$report) {
            return response()->json(['message' => 'Report not found.'], 404);
        }

        if ($report->forwarded_to_dsa) {
            return response()->json(['message' => 'Report already forwarded to DSA.'], 422);
        }

        $report->update([
            'forwarded_to_dsa' => true,
            'sent_to'          => 'dsa',
            'forwarded_at'     => now(),
        ]);

        return response()->json([
            'message' => 'Report forwarded to DSA successfully.',
            'report'  => $this->formatReport($report->load('uploader')),
        ]);
    }

    // ── DELETE report ─────────────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $report = Report::where('id', $id)
            ->where('club_id', $club->id)
            ->first();

        if (!$report) {
            return response()->json(['message' => 'Report not found.'], 404);
        }

        // Delete file from storage
        Storage::disk('public')->delete($report->file_path);
        $report->delete();

        return response()->json(['message' => 'Report deleted successfully.']);
    }

    // ── GET reports for DSA (Super Admin) ─────────────────────────
    public function dsaIndex(Request $request)
    {
        $reports = Report::where('forwarded_to_dsa', true)
            ->with(['uploader:id,name', 'club:id,name'])
            ->orderBy('forwarded_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id'           => $r->id,
                    'title'        => $r->title,
                    'type'         => $r->type,
                    'file_name'    => $r->file_name,
                    'file_size'    => $r->file_size,
                    'file_url'     => asset('storage/' . $r->file_path),
                    'club_name'    => $r->club->name ?? '—',
                    'uploaded_by'  => $r->uploader->name ?? '—',
                    'role'         => $r->role,
                    'forwarded_at' => $r->forwarded_at
                                        ? $r->forwarded_at->format('M d, Y h:i A')
                                        : null,
                    'created_at'   => $r->created_at->format('M d, Y'),
                ];
            });

        return response()->json([
            'reports' => $reports,
            'total'   => $reports->count(),
        ]);
    }
}