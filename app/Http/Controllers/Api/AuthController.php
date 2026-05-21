<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:8|confirmed',
            'role'       => 'required|in:advisor,student',
            // Advisor fields
            'staff_id'   => 'required_if:role,advisor|nullable|string',
            'department' => 'required_if:role,advisor|nullable|string',
            // Student fields
            'student_id' => 'required_if:role,student|nullable|string',
            'course'     => 'required_if:role,student|nullable|string',
            'year'       => 'required_if:role,student|nullable|string',
        ]);

        // Advisor starts as pending, student is active immediately
        $status = $request->role === 'advisor' ? 'pending' : 'active';

        $user = User::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => $validated['role'],
            'status'     => $status,
            'staff_id'   => $validated['staff_id'] ?? null,
            'department' => $validated['department'] ?? null,
            'student_id' => $validated['student_id'] ?? null,
            'course'     => $validated['course'] ?? null,
            'year'       => $validated['year'] ?? null,
        ]);

        return response()->json([
            'message' => $request->role === 'advisor'
                ? 'Registration successful! Please wait for Super Admin approval.'
                : 'Registration successful! You can now login.',
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ]
        ], 201);
    }

    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'These credentials do not match our records.'
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Incorrect password. Please try again.'
            ], 401);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact admin.'
            ], 403);
        }

        // Check if advisor is still pending
        if ($user->role === 'advisor' && $user->status === 'pending') {
            return response()->json([
                'message' => 'Your account is pending approval from Super Admin!'
            ], 403);
        }

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful!',
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'token' => $token,
        ], 200);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully!'
        ], 200);
    }
}