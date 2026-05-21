<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkPlan;
use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkPlanController extends Controller
{
    private function formatSize($bytes)
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        return round($bytes / 1024, 1) . ' KB';
    }

    private function formatPlan($plan)
    {
        return [
            'id'          => $plan->id,
            'title'       => $plan->title,
            'file_name'   => $plan->file_name,
            'file_size'   => $plan->file_size,
            'file_url'    => asset('storage/' . $plan->file_path),
            'uploaded_by' => $plan->uploader->name ?? '—',
            'created_at'  => $plan->created_at->format('M d, Y'),
        ];
    }

    // ── GET all work plans for advisor's club ─────────────────────
    public function index(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $plans = WorkPlan::where('club_id', $club->id)
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => $this->formatPlan($p));

        return response()->json([
            'work_plans' => $plans,
            'total'      => $plans->count(),
        ]);
    }

    // ── POST upload new work plan ─────────────────────────────────
    public function store(Request $request)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'file'  => 'required|file|mimes:pdf,doc,docx',
        ]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileSize = $this->formatSize($file->getSize());
        $filePath = $file->store('work-plans', 'public');

        $plan = WorkPlan::create([
            'club_id'     => $club->id,
            'uploaded_by' => $user->id,
            'title'       => $request->title,
            'file_path'   => $filePath,
            'file_name'   => $fileName,
            'file_size'   => $fileSize,
        ]);

        return response()->json([
            'message'   => 'Work plan uploaded successfully.',
            'work_plan' => $this->formatPlan($plan->load('uploader')),
        ], 201);
    }

    // ── DELETE work plan ─────────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = Club::where('advisor_id', $user->id)->first();

        if (!$club) {
            return response()->json(['message' => 'No club found for this advisor.'], 404);
        }

        $plan = WorkPlan::where('id', $id)
            ->where('club_id', $club->id)
            ->first();

        if (!$plan) {
            return response()->json(['message' => 'Work plan not found.'], 404);
        }

        Storage::disk('public')->delete($plan->file_path);
        $plan->delete();

        return response()->json(['message' => 'Work plan deleted successfully.']);
    }
}