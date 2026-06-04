<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Category;
use App\Models\ClubAdvisor;
use App\Models\ClubMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClubController extends Controller
{
    // GET all active clubs (for directory)
    public function index()
    {
        $clubs = Club::with('advisor:id,name,email')
            ->withCount('members')
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($clubs);
    }

    // GET clubs grouped by category
    public function byCategory()
    {
        $clubs      = Club::where('status', 'active')->withCount('members')->get();
        $categories = Category::orderBy('name')->get();

        $result = $categories->map(function($cat) use ($clubs) {
            return [
                'id'    => $cat->id,
                'name'  => $cat->name,
                'clubs' => $clubs->where('category', $cat->name)->values(),
            ];
        });

        return response()->json($result);
    }

    // ── Helper: build enriched club response ──────────────────
    private function buildClubResponse($club)
    {
        // ✅ Get all secretaries from users table (role = 'secretary' + member of this club)
        $secretaries = ClubMember::where('club_id', $club->id)
            ->where('status', 'active')
            ->whereHas('user', fn($q) => $q->where('role', 'secretary'))
            ->with('user:id,name,email,student_id')
            ->get()
            ->map(fn($m) => [
                'id'         => $m->user->id,
                'name'       => $m->user->name,
                'email'      => $m->user->email,
                'student_id' => $m->user->student_id,
            ]);

        // ✅ Get all co-advisors from club_advisors table
        $coAdvisors = ClubAdvisor::where('club_id', $club->id)
            ->where('is_main', false)
            ->with('user:id,name,email')
            ->get()
            ->map(fn($ca) => [
                'id'    => $ca->user->id,
                'name'  => $ca->user->name,
                'email' => $ca->user->email,
            ]);

        return array_merge($club->toArray(), [
            'secretaries' => $secretaries,
            'co_advisors' => $coAdvisors,
            'cover_photo_url' => $club->cover_photo ? asset('storage/' . $club->cover_photo) : null,
        ]);
    }

    // GET advisor's / co_advisor's / secretary's own club
    public function myClub(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            if (!$user) {
                return response()->json(null, 401);
            }

            $club = null;

            if ($user->role === 'advisor') {
                $club = Club::with('advisor:id,name,email')
                    ->withCount('members')
                    ->where('advisor_id', $user->id)
                    ->first();

            } elseif ($user->role === 'co_advisor') {
                $clubAdvisor = ClubAdvisor::where('user_id', $user->id)
                    ->where('is_main', false)
                    ->first();

                if ($clubAdvisor) {
                    $club = Club::with('advisor:id,name,email')
                        ->withCount('members')
                        ->find($clubAdvisor->club_id);
                }

            } elseif ($user->role === 'secretary') {
                // ✅ FIX: try secretary role first, fallback to any active membership
                $member = ClubMember::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->where('role', 'secretary')
                    ->first();

                if (!$member) {
                    $member = ClubMember::where('user_id', $user->id)
                        ->where('status', 'active')
                        ->first();
                }

                if ($member) {
                    $club = Club::with('advisor:id,name,email')
                        ->withCount('members')
                        ->find($member->club_id);
                }
            }

            if (!$club) {
                return response()->json(null, 404);
            }

            // ✅ Return enriched response with real secretaries + co-advisors
            return response()->json($this->buildClubResponse($club));

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST create a new club (advisor only)
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'advisor') {
                return response()->json(['message' => 'Only advisors can create a club.'], 403);
            }

            $existing = Club::where('advisor_id', $user->id)->first();
            if ($existing) {
                return response()->json(['message' => 'You already have a club.'], 422);
            }

            $request->validate([
                'name'        => 'required|string|unique:clubs,name|max:100',
                'category'    => 'required|string|max:100',
                'description' => 'nullable|string|max:500',
                'aim'         => 'nullable|string|max:255',
                'objectives'  => 'nullable|array',
            ]);

            $enrollmentKey = strtoupper(Str::random(8));

            $club = Club::create([
                'name'           => $request->name,
                'category'       => $request->category,
                'description'    => $request->description ?? '',
                'aim'            => $request->aim ?? '',
                'objectives'     => $request->objectives ? json_encode($request->objectives) : null,
                'enrollment_key' => $enrollmentKey,
                'advisor_id'     => $user->id,
                'status'         => 'active',
            ]);

            return response()->json([
                'message' => 'Club created successfully!',
                'club'    => $club
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT update club details — secretary/co_advisor fields NOT editable
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $club = null;

            if ($user->role === 'advisor') {
                $club = Club::where('id', $id)->where('advisor_id', $user->id)->first();

            } elseif ($user->role === 'co_advisor') {
                $clubAdvisor = ClubAdvisor::where('user_id', $user->id)
                    ->where('club_id', $id)->where('is_main', false)->first();
                if ($clubAdvisor) $club = Club::find($id);

            } elseif ($user->role === 'secretary') {
                $member = ClubMember::where('user_id', $user->id)
                    ->where('club_id', $id)->where('status', 'active')
                    ->where('role', 'secretary')->first();
                if (!$member) {
                    $member = ClubMember::where('user_id', $user->id)
                        ->where('club_id', $id)->where('status', 'active')->first();
                }
                if ($member) $club = Club::find($id);
            }

            if (!$club) {
                return response()->json(['message' => 'Club not found or unauthorized.'], 404);
            }

            $request->validate([
                'name'        => 'sometimes|string|unique:clubs,name,' . $id . '|max:100',
                'description' => 'nullable|string|max:500',
                'aim'         => 'nullable|string|max:255',
                'objectives'  => 'nullable|array',
                'cover_photo' => 'nullable|image|max:5120',
            ]);

            $data = $request->only(['name', 'description', 'aim', 'objectives']);

            // Handle cover photo upload
            if ($request->hasFile('cover_photo')) {
                // Delete old cover photo
                if ($club->cover_photo) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($club->cover_photo);
                }
                $path = $request->file('cover_photo')->store('clubs/covers', 'public');
                $data['cover_photo'] = $path;
            }

            $club->update($data);

            return response()->json([
                'message' => 'Club updated successfully!',
                'club'    => $this->buildClubResponse($club->fresh(['advisor'])->loadCount('members')),
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}