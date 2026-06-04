<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class AuthController extends Controller
{
    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'These credentials do not match our records.'], 401);
        }

        if (!$user->password || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password. Please try again.'], 401);
        }

        if ($user->status === 'inactive') {
            return response()->json(['message' => 'Your account has been deactivated. Please contact admin.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Force password change for first time login
        if ($user->force_password_change) {
            return response()->json([
                'message'               => 'Please change your password.',
                'force_password_change' => true,
                'token'                 => $token,
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ], 200);
        }

        // Get club_id for advisor
        $clubId = null;
        if (in_array($user->role, ['advisor', 'co_advisor'])) {
            $club = Club::where('advisor_id', $user->id)->first();
            if (!$club) {
                // check co_advisor table
                $coAdvisor = \App\Models\ClubAdvisor::where('user_id', $user->id)->first();
                if ($coAdvisor) $clubId = $coAdvisor->club_id;
            } else {
                $clubId = $club->id;
            }
        }

        return response()->json([
            'message' => 'Login successful!',
            'token'   => $token,
            'user' => [
                'id'      => $user->id,
                'name'    => $user->name,
                'email'   => $user->email,
                'role'    => $user->role,
                'club_id' => $clubId,
            ],
        ], 200);
    }

    // CHANGE PASSWORD (force change on first login)
    public function changePassword(Request $request)
    {
        $request->validate([
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $user = $request->user();
        $user->update([
            'password'              => Hash::make($request->password),
            'force_password_change' => false,
        ]);

        // Get club_id for advisor after password change
        $clubId = null;
        if (in_array($user->role, ['advisor', 'co_advisor'])) {
            $club = Club::where('advisor_id', $user->id)->first();
            if ($club) $clubId = $club->id;
        }

        return response()->json([
            'message' => 'Password changed successfully!',
            'club_id' => $clubId,
        ]);
    }

    // VERIFY EMAIL (kept for backward compat)
    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);
        if (!hash_equals(sha1($user->email), $hash)) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 200);
        }
        $user->email_verified_at = Carbon::now();
        $user->save();
        return response()->json(['message' => 'Email verified successfully!'], 200);
    }

    // RESEND VERIFICATION (kept for backward compat)
    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();
        if (!$user) return response()->json(['message' => 'User not found.'], 404);
        return response()->json(['message' => 'Verification email resent!'], 200);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully!'], 200);
    }
}