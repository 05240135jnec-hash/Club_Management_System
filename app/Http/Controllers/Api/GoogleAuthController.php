<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\User;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     * GET /auth/google/redirect
     */
    public function redirect()
    {
        try {
            return \Laravel\Socialite\Facades\Socialite::driver('google')
                ->with(['prompt' => 'select_account'])
                ->redirect();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google redirect error: ' . $e->getMessage());
            return redirect('/login?google_error=' . urlencode('Failed: ' . $e->getMessage()));
        }
    }

    /**
     * Handle Google OAuth callback
     * GET /auth/google/callback
     */
    public function callback()
    {
        try {
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect('/login?google_error=' . urlencode('Google authentication failed: ' . $e->getMessage()));
        }

        // Find user by email only — no auto registration
        $user = User::where('email', $googleUser->getEmail())->first();

        // Email not found in system
        if (!$user) {
            return redirect('/login?google_error=' . urlencode('Your account is not registered in the system. Please contact the administrator.'));
        }

        // Account is inactive
        if ($user->status === 'inactive') {
            return redirect('/login?google_error=' . urlencode('Your account has been deactivated. Please contact admin.'));
        }

        // Save google_id if not saved yet
        if (!$user->google_id) {
            $user->update(['google_id' => $googleUser->getId()]);
        }

        // Create token
        $token = $user->createToken('google_auth_token')->plainTextToken;

        // Get club_id for advisor/co_advisor
        $clubId = null;
        if (in_array($user->role, ['advisor', 'co_advisor'])) {
            $club = Club::where('advisor_id', $user->id)->first();
            if (!$club) {
                $coAdvisor = \App\Models\ClubAdvisor::where('user_id', $user->id)->first();
                if ($coAdvisor) $clubId = $coAdvisor->club_id;
            } else {
                $clubId = $club->id;
            }
        }

        // Redirect to frontend with token in URL
        $params = http_build_query([
            'token'   => $token,
            'role'    => $user->role,
            'name'    => $user->name,
            'email'   => $user->email,
            'club_id' => $clubId ?? '',
        ]);

        return redirect('/auth/google/success?' . $params);
    }
}