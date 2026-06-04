<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // ── GET current user profile ──────────────────────────────
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'department' => $user->department ?? '',
                'staff_id'   => $user->staff_id   ?? '',
                'student_id' => $user->student_id ?? '',
                'course'     => $user->course      ?? '',
                'year'       => $user->year        ?? '',
                'avatar'     => $user->avatar
                                    ? asset('storage/' . $user->avatar)
                                    : null,
                'signature'  => $user->signature   ?? null,
            ],
        ]);
    }

    // ── POST update profile ───────────────────────────────────
    public function update(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name'       => 'sometimes|required|string|max:255',
            'email'      => 'sometimes|required|email|unique:users,email,' . $user->id,
            'department' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:255',
            'course'     => 'nullable|string|max:255',
            'year'       => 'nullable|string|max:50',
            'avatar'     => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);
        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }
        $user->update($validated);
        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'department' => $user->department ?? '',
                'staff_id'   => $user->staff_id   ?? '',
                'student_id' => $user->student_id ?? '',
                'course'     => $user->course      ?? '',
                'year'       => $user->year        ?? '',
                'avatar'     => $user->avatar
                                    ? asset('storage/' . $user->avatar)
                                    : null,
                'signature'  => $user->signature   ?? null,
            ],
        ]);
    }

    // ── PUT change password ───────────────────────────────────
    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }
        $user->update(['password' => Hash::make($request->new_password)]);
        return response()->json(['message' => 'Password changed successfully.']);
    }

    // ── POST upload/draw signature ────────────────────────────
    public function updateSignature(Request $request)
    {
        $user = $request->user();

        // Upload image signature
        if ($request->hasFile('signature')) {
            $request->validate([
                'signature' => 'required|file|mimes:jpg,jpeg,png,webp|max:2048',
            ]);
            $path = $request->file('signature')->store('signatures', 'public');
            $user->update(['signature' => asset('storage/' . $path)]);

            return response()->json([
                'message'   => 'Signature uploaded successfully.',
                'signature' => asset('storage/' . $path),
            ]);
        }

        // Draw signature (base64)
        if ($request->has('signature_data')) {
            $request->validate([
                'signature_data' => 'required|string',
            ]);

            // Save base64 directly to users table
            $user->update(['signature' => $request->signature_data]);

            return response()->json([
                'message'   => 'Signature saved successfully.',
                'signature' => $request->signature_data,
            ]);
        }

        // Clear signature
        if ($request->has('clear') && $request->clear) {
            $user->update(['signature' => null]);
            return response()->json(['message' => 'Signature cleared.', 'signature' => null]);
        }

        return response()->json(['message' => 'No signature data provided.'], 422);
    }
}