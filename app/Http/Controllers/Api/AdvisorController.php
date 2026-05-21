<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;

class AdvisorController extends Controller
{
    // GET all advisors
    public function index()
    {
        $advisors = User::where('role', 'advisor')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id'         => $user->id,
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'staff_id'   => $user->staff_id,
                    'department' => $user->department,
                    'status'     => $user->status,
                    'registered' => $user->created_at->format('Y-m-d'),
                ];
            });

        return response()->json($advisors);
    }

    // Approve advisor
    public function approve($id)
    {
        $user = User::find($id);

        if (!$user || $user->role !== 'advisor') {
            return response()->json(['message' => 'Advisor not found.'], 404);
        }

        $user->status = 'active';
        $user->save();

        return response()->json(['message' => 'Advisor approved successfully!']);
    }

    // Reject advisor
    public function reject($id)
    {
        $user = User::find($id);

        if (!$user || $user->role !== 'advisor') {
            return response()->json(['message' => 'Advisor not found.'], 404);
        }

        $user->status = 'rejected';
        $user->save();

        return response()->json(['message' => 'Advisor rejected successfully!']);
    }
}