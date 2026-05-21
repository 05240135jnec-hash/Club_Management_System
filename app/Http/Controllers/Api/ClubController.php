<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClubController extends Controller
{
    // GET all active clubs (for directory)
    public function index()
    {
        $clubs = Club::with('advisor:id,name,email')
            ->withCount('members')          // ← adds members_count automatically
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

    // GET advisor's own club
    public function myClub(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            if (!$user) {
                return response()->json(null, 401);
            }

            $club = Club::with('advisor:id,name,email')
                ->withCount('members')
                ->where('advisor_id', $user->id)
                ->first();

            if (!$club) {
                return response()->json(null, 404);
            }

            return response()->json($club);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST create a new club
    public function store(Request $request)
    {
        try {
            $existing = Club::where('advisor_id', $request->user()->id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'You already have a club.'
                ], 422);
            }

            $request->validate([
                'name'        => 'required|string|unique:clubs,name|max:100',
                'category'    => 'required|string|max:100',
                'description' => 'nullable|string|max:500',
                'aim'         => 'nullable|string|max:255',
                'secretary'   => 'nullable|string|max:100',
                'objectives'  => 'nullable|array',
            ]);

            $enrollmentKey = strtoupper(Str::random(8));

            $club = Club::create([
                'name'           => $request->name,
                'category'       => $request->category,
                'description'    => $request->description ?? '',
                'aim'            => $request->aim ?? '',
                'secretary'      => $request->secretary ?? '',
                'objectives'     => $request->objectives ? json_encode($request->objectives) : null,
                'enrollment_key' => $enrollmentKey,
                'advisor_id'     => $request->user()->id,
                'status'         => 'active',
            ]);

            return response()->json([
                'message' => 'Club created successfully!',
                'club'    => $club
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // PUT update club details
    public function update(Request $request, $id)
    {
        try {
            $club = Club::where('id', $id)
                ->where('advisor_id', $request->user()->id)
                ->first();

            if (!$club) {
                return response()->json(['message' => 'Club not found.'], 404);
            }

            $request->validate([
                'name'        => 'sometimes|string|unique:clubs,name,' . $id . '|max:100',
                'description' => 'nullable|string|max:500',
                'aim'         => 'nullable|string|max:255',
                'secretary'   => 'nullable|string|max:100',
                'objectives'  => 'nullable|array',
            ]);

            $club->update($request->only([
                'name', 'description', 'aim', 'secretary', 'objectives'
            ]));

            return response()->json([
                'message' => 'Club updated successfully!',
                'club'    => $club
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }
}