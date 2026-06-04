<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkPlan;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\ClubAdvisor;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkPlanController extends Controller
{
    private function getClub($user)
    {
        if ($user->role === 'advisor') return Club::where('advisor_id', $user->id)->first();
        if ($user->role === 'co_advisor') {
            $ca = ClubAdvisor::where('user_id', $user->id)->where('is_main', false)->first();
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
            'updated_by'  => $plan->updater->name ?? null,
            'created_at'  => $plan->created_at->format('M d, Y'),
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $plans = WorkPlan::where('club_id', $club->id)
            ->with(['uploader:id,name', 'updater:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()->map(fn($p) => $this->formatPlan($p));

        return response()->json(['work_plans' => $plans, 'total' => $plans->count()]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $request->validate(['title' => 'required|string|max:255', 'file' => 'required|file|mimes:pdf,doc,docx']);

        $file = $request->file('file');
        $plan = WorkPlan::create([
            'club_id'     => $club->id,
            'uploaded_by' => $user->id,
            'title'       => $request->title,
            'file_path'   => $file->store('work-plans', 'public'),
            'file_name'   => $file->getClientOriginalName(),
            'file_size'   => $this->formatSize($file->getSize()),
        ]);

        if ($user->role === 'secretary') {
            NotificationService::workPlanUploaded($club->id, $user->name, $request->title);
        }

        return response()->json(['message' => 'Work plan uploaded successfully.', 'work_plan' => $this->formatPlan($plan->load(['uploader', 'updater']))], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $plan = WorkPlan::where('id', $id)->where('club_id', $club->id)->first();
        if (!$plan) return response()->json(['message' => 'Work plan not found.'], 404);

        $request->validate(['title' => 'required|string|max:255']);
        $plan->update(['title' => $request->title, 'updated_by' => $user->id]);

        return response()->json(['message' => 'Work plan updated successfully.', 'work_plan' => $this->formatPlan($plan->load(['uploader', 'updater']))]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $club = $this->getClub($user);
        if (!$club) return response()->json(['message' => 'No club found.'], 404);

        $plan = WorkPlan::where('id', $id)->where('club_id', $club->id)->first();
        if (!$plan) return response()->json(['message' => 'Work plan not found.'], 404);

        Storage::disk('public')->delete($plan->file_path);
        $plan->delete();

        return response()->json(['message' => 'Work plan deleted successfully.']);
    }
}