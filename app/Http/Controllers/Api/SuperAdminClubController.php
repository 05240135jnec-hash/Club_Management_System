<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\User;
use App\Models\ClubMember;
use App\Models\ClubAdvisor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SuperAdminClubController extends Controller
{
    /**
     * GET /api/superadmin/clubs
     */
    public function index(Request $request)
    {
        $status = $request->query('status', 'active');

        $query = Club::with(['advisor', 'members'])
            ->withCount([
                'members as member_count' => function ($q) {
                    $q->whereNull('removed_at')
                        ->where('status', 'active');
                }
            ]);

        if ($status === 'active') {
            $query->where('status', 'active');
        } elseif ($status === 'inactive') {
            $query->where('status', 'inactive');
        }

        $clubs = $query->orderBy('name')->get();

        return response()->json([
            'clubs' => $clubs->map(function ($club) {
                return [
                    'id'                   => $club->id,
                    'name'                 => $club->name,
                    'category'             => $club->category,
                    'description'          => $club->description,
                    'cover_photo'          => $club->cover_photo,
                    'status'               => $club->status,
                    'member_count'         => $club->member_count ?? 0,
                    'audit_report_enabled' => $club->audit_report_enabled,
                    'blog_enabled'         => $club->blog_enabled,
                    'advisor'              => $club->advisor ? [
                        'id'         => $club->advisor->id,
                        'name'       => $club->advisor->name,
                        'email'      => $club->advisor->email,
                        'department' => $club->advisor->department,
                    ] : null,
                    'created_at' => $club->created_at?->format('M d, Y'),
                ];
            }),
            'total_active'   => Club::where('status', 'active')->count(),
            'total_inactive' => Club::where('status', 'inactive')->count(),
        ]);
    }

    /**
     * GET /api/superadmin/clubs/{id}
     */
    public function show($id)
    {
        $club = Club::with(['advisor', 'members.user'])
            ->withCount([
                'members as member_count' => function ($q) {
                    $q->whereNull('removed_at')
                      ->where('status', 'active');
                }
            ])
            ->findOrFail($id);

        $secretaries = $club->members()
            ->where('role', 'secretary')
            ->where('status', 'active')
            ->whereNull('removed_at')
            ->with('user')
            ->get()
            ->map(function ($m) {
                return [
                    'id'   => $m->user->id ?? null,
                    'name' => $m->user->name ?? 'Unknown',
                ];
            });

        $coAdvisors = ClubAdvisor::where('club_id', $club->id)
            ->where('is_main', false)
            ->with('user:id,name,email')
            ->get()
            ->map(function ($ca) {
                return [
                    'id'   => $ca->user->id ?? null,
                    'name' => $ca->user->name ?? 'Unknown',
                ];
            });

        $members = $club->members()
            ->where('status', 'active')
            ->whereNull('removed_at')
            ->with('user:id,name,email,student_id,course,year')
            ->get()
            ->map(function ($m) {
                return [
                    'id'         => $m->user->id ?? null,
                    'name'       => $m->user->name ?? 'Unknown',
                    'email'      => $m->user->email ?? '—',
                    'student_id' => $m->user->student_id ?? '—',
                    'course'     => $m->user->course ?? '—',
                    'year'       => $m->user->year ?? '—',
                    'role'       => $m->role ?? 'member',
                    'joined_at'  => $m->created_at?->format('M d, Y'),
                ];
            });

        return response()->json([
            'club' => [
                'id'           => $club->id,
                'name'         => $club->name,
                'category'     => $club->category,
                'description'  => $club->description,
                'aim'          => $club->aim,
                'objectives'   => $club->objectives,
                'status'       => $club->status,
                'cover_photo'  => $club->cover_photo,
                'member_count' => $club->member_count ?? 0,
                'created_at'   => $club->created_at?->format('M d, Y'),
                'advisor'      => $club->advisor ? [
                    'id'         => $club->advisor->id,
                    'name'       => $club->advisor->name,
                    'email'      => $club->advisor->email,
                    'department' => $club->advisor->department,
                ] : null,
                'co_advisors'  => $coAdvisors,
                'secretaries'  => $secretaries,
                'members'      => $members,
            ],
        ]);
    }

    /**
     * PUT /api/superadmin/clubs/{id}
     */
    public function update(Request $request, $id)
    {
        $club = Club::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255|unique:clubs,name,' . $id,
            'category'    => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'aim'         => 'nullable|string',
            'objectives'  => 'nullable|string',
        ]);

        $club->update($validated);

        return response()->json([
            'message' => 'Club updated successfully.',
            'club' => [
                'id'          => $club->id,
                'name'        => $club->name,
                'category'    => $club->category,
                'description' => $club->description,
                'aim'         => $club->aim,
                'objectives'  => $club->objectives,
                'status'      => $club->status,
            ],
        ]);
    }

    /**
     * PUT /api/superadmin/clubs/{id}/deactivate
     */
    public function deactivate($id)
    {
        $club = Club::findOrFail($id);
        if ($club->status === 'inactive') {
            return response()->json(['message' => 'Club is already inactive.'], 422);
        }
        $club->update(['status' => 'inactive']);
        return response()->json([
            'message' => $club->name . ' has been deactivated.',
            'club'    => ['id' => $club->id, 'status' => 'inactive'],
        ]);
    }

    /**
     * PUT /api/superadmin/clubs/{id}/restore
     */
    public function restore($id)
    {
        $club = Club::findOrFail($id);
        if ($club->status === 'active') {
            return response()->json(['message' => 'Club is already active.'], 422);
        }
        $club->update(['status' => 'active']);
        return response()->json([
            'message' => $club->name . ' has been restored.',
            'club'    => ['id' => $club->id, 'status' => 'active'],
        ]);
    }

    /**
     * DELETE /api/superadmin/clubs/{id}
     */
    public function destroy($id)
    {
        $club = Club::findOrFail($id);
        if ($club->status === 'active') {
            return response()->json([
                'message' => 'Cannot permanently delete an active club. Deactivate it first.'
            ], 422);
        }
        $clubName = $club->name;
        $club->delete();
        return response()->json(['message' => $clubName . ' has been permanently deleted.']);
    }

    /**
     * DELETE /api/superadmin/advisors/{id}
     */
    public function destroyAdvisor($id)
    {
        try {
            $advisor = User::findOrFail($id);
            $advisor->update(['status' => 'inactive']);
            return response()->json(['message' => $advisor->name . ' has been removed from the panel.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to remove advisor.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/superadmin/reports
     */
    public function reportsIndex(Request $request)
    {
        $reports = \App\Models\Report::where('forwarded_to_dsa', true)
            ->where('is_audit', false)
            ->with(['uploader:id,name', 'club:id,name,category'])
            ->orderBy('forwarded_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id'            => $r->id,
                    'title'         => $r->title,
                    'type'          => $r->type,
                    'file_name'     => $r->file_name,
                    'file_size'     => $r->file_size,
                    'file_url'      => asset('storage/' . $r->file_path),
                    'club_name'     => $r->club->name ?? '—',
                    'club_category' => $r->club->category ?? '—',
                    'uploaded_by'   => $r->uploader->name ?? '—',
                    'role'          => $r->role,
                    'forwarded_at'  => $r->forwarded_at ? $r->forwarded_at->format('M d, Y h:i A') : null,
                    'year'          => $r->forwarded_at ? $r->forwarded_at->format('Y') : $r->created_at->format('Y'),
                    'created_at'    => $r->created_at->format('M d, Y'),
                ];
            });

        return response()->json(['reports' => $reports, 'total' => $reports->count()]);
    }

    /**
     * DELETE /api/superadmin/reports/{id}
     */
    public function reportsDestroy($id)
    {
        $report = \App\Models\Report::findOrFail($id);
        \Illuminate\Support\Facades\Storage::disk('public')->delete($report->file_path);
        $report->delete();
        return response()->json(['message' => 'Report deleted successfully.']);
    }

    /**
     * GET /api/superadmin/announcements
     */
    public function announcementsIndex(Request $request)
    {
        $announcements = \App\Models\Announcement::whereNull('club_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ann) {
                return [
                    'id'         => $ann->id,
                    'title'      => $ann->title,
                    'type'       => $ann->type,
                    'content'    => $ann->content,
                    'recipients' => $ann->recipients,
                    'date_sent'  => $ann->created_at->format('M d, Y h:i A'),
                    'created_at' => $ann->created_at->format('M d, Y'),
                    'attachment' => $ann->attachment ? asset('storage/' . $ann->attachment) : null,
                ];
            });

        return response()->json(['announcements' => $announcements, 'total' => $announcements->count()]);
    }

    /**
     * POST /api/superadmin/announcements
     */
    public function announcementsStore(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'type'       => 'required|in:event,general,reminder',
            'content'    => 'required|string',
            'recipients' => 'required|in:advisors,students,both',
            'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx',
        ]);

        $attachmentPath = null;
        $attachmentName = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('announcements', 'public');
        }

        $announcement = \App\Models\Announcement::create([
            'club_id'         => null,
            'created_by'      => $user->id,
            'title'           => $validated['title'],
            'type'            => $validated['type'],
            'content'         => $validated['content'],
            'recipients'      => $validated['recipients'],
            'attachment'      => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        return response()->json([
            'message' => 'Announcement posted successfully.',
            'announcement' => [
                'id'         => $announcement->id,
                'title'      => $announcement->title,
                'type'       => $announcement->type,
                'content'    => $announcement->content,
                'recipients' => $announcement->recipients,
                'date_sent'  => $announcement->created_at->format('M d, Y h:i A'),
                'created_at' => $announcement->created_at->format('M d, Y'),
                'attachment' => $attachmentPath ? asset('storage/' . $attachmentPath) : null,
            ],
        ], 201);
    }

    /**
     * POST /api/superadmin/announcements/{id}
     */
    public function announcementsUpdate(Request $request, $id)
    {
        $announcement = \App\Models\Announcement::whereNull('club_id')->findOrFail($id);
        $validated = $request->validate([
            'title'      => 'sometimes|required|string|max:255',
            'type'       => 'sometimes|required|in:event,general,reminder',
            'content'    => 'sometimes|required|string',
            'recipients' => 'sometimes|required|in:advisors,students,both',
            'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx',
        ]);

        if ($request->hasFile('attachment')) {
            if ($announcement->attachment) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($announcement->attachment);
            }
            $file = $request->file('attachment');
            $validated['attachment']      = $file->store('announcements', 'public');
            $validated['attachment_name'] = $file->getClientOriginalName();
        }

        $announcement->update($validated);

        return response()->json([
            'message' => 'Announcement updated successfully.',
            'announcement' => [
                'id'         => $announcement->id,
                'title'      => $announcement->title,
                'type'       => $announcement->type,
                'content'    => $announcement->content,
                'recipients' => $announcement->recipients,
                'date_sent'  => $announcement->created_at->format('M d, Y h:i A'),
                'created_at' => $announcement->created_at->format('M d, Y'),
                'attachment' => $announcement->attachment ? asset('storage/' . $announcement->attachment) : null,
            ],
        ]);
    }

    /**
     * DELETE /api/superadmin/announcements/{id}
     */
    public function announcementsDestroy($id)
    {
        $announcement = \App\Models\Announcement::whereNull('club_id')->findOrFail($id);
        if ($announcement->attachment) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($announcement->attachment);
        }
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted successfully.']);
    }

    /**
     * PUT /api/superadmin/clubs/{id}/features
     */
    public function updateFeatures(Request $request, $id)
    {
        $club = Club::findOrFail($id);
        $validated = $request->validate([
            'audit_report_enabled' => 'required|boolean',
            'blog_enabled'         => 'required|boolean',
        ]);
        $club->update($validated);
        return response()->json([
            'message' => 'Features updated successfully.',
            'club'    => [
                'id'                   => $club->id,
                'audit_report_enabled' => $club->audit_report_enabled,
                'blog_enabled'         => $club->blog_enabled,
            ],
        ]);
    }

    /**
     * GET /api/superadmin/clubs/{id}/albums
     */
    public function albums($id)
    {
        $albums = \App\Models\ImageAlbum::where('club_id', $id)
            ->with(['uploader:id,name', 'images'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($album) {
                return [
                    'id'          => $album->id,
                    'title'       => $album->title,
                    'caption'     => $album->caption,
                    'club_id'     => $album->club_id,
                    'uploaded_by' => $album->uploader->name ?? '—',
                    'created_at'  => $album->created_at->format('M d, Y'),
                    'images'      => $album->images->map(fn($img) => [
                        'id'        => $img->id,
                        'url'       => asset('storage/' . $img->file_path),
                        'file_name' => $img->file_name,
                    ]),
                ];
            });

        return response()->json(['albums' => $albums]);
    }

    /* ── User Management ── */
    public function usersIndex(Request $request)
    {
        $status = $request->query('status', 'active');
        $users = User::where('role', '!=', 'super_admin')
            ->where('status', $status)
            ->orderBy('created_at', 'desc')
            ->get(['id','name','email','role','status','staff_id','student_id','department','course','year']);
        return response()->json(['users' => $users]);
    }

    public function usersStore(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'staff_id'   => 'nullable|string',
            'student_id' => 'nullable|string',
            'department' => 'nullable|string',
            'course'     => 'nullable|string',
            'year'       => 'nullable|string',
        ]);

        $studentId = !empty($validated['student_id']) ? trim($validated['student_id']) : null;
        $staffId   = !empty($validated['staff_id'])   ? trim($validated['staff_id'])   : null;

        $emailPrefix = strpos($validated['email'], '.jnec@') !== false
            ? explode('.jnec@', $validated['email'])[0]
            : explode('@', $validated['email'])[0];

        $defaultPwd = $studentId ?? $staffId ?? $emailPrefix;

        $user = User::create([
            'name'                  => $validated['name'],
            'email'                 => $validated['email'],
            'password'              => Hash::make($defaultPwd),
            'role'                  => 'student',
            'status'                => 'active',
            'force_password_change' => true,
            'email_verified_at'     => now(),
            'staff_id'              => $staffId,
            'student_id'            => $studentId,
            'department'            => !empty($validated['department']) ? $validated['department'] : null,
            'course'                => !empty($validated['course'])     ? $validated['course']     : null,
            'year'                  => !empty($validated['year'])       ? $validated['year']       : null,
        ]);

        return response()->json(['user' => $user, 'default_password' => $defaultPwd], 201);
    }

    public function usersUpdate(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email,'.$id,
            'staff_id'   => 'nullable|string',
            'student_id' => 'nullable|string',
            'department' => 'nullable|string',
            'course'     => 'nullable|string',
            'year'       => 'nullable|string',
        ]);
        $user->update($validated);
        return response()->json(['user' => $user]);
    }

    public function usersBulk(Request $request)
    {
        $rows     = $request->input('users', []);
        $imported = 0; $skipped = 0; $errors = 0;
        foreach ($rows as $row) {
            try {
                if (empty($row['name']) || empty($row['email'])) { $skipped++; continue; }
                if (User::where('email', $row['email'])->exists()) { $skipped++; continue; }

                $emailPrefix = strpos($row['email'], '.jnec@') !== false
                    ? explode('.jnec@', $row['email'])[0]
                    : explode('@', $row['email'])[0];

                $defaultPwd = !empty($row['student_id'])
                    ? $row['student_id']
                    : (!empty($row['staff_id']) ? $row['staff_id'] : $emailPrefix);

                User::create([
                    'name'                  => $row['name'],
                    'email'                 => $row['email'],
                    'password'              => Hash::make($defaultPwd),
                    'role'                  => 'student',
                    'status'                => 'active',
                    'force_password_change' => true,
                    'email_verified_at'     => now(),
                    'staff_id'              => !empty($row['staff_id'])   ? $row['staff_id']   : null,
                    'student_id'            => !empty($row['student_id']) ? $row['student_id'] : null,
                    'department'            => !empty($row['department']) ? $row['department'] : null,
                    'course'                => !empty($row['course'])     ? $row['course']     : null,
                    'year'                  => !empty($row['year'])       ? $row['year']       : null,
                ]);
                $imported++;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Bulk import error: ' . $e->getMessage());
                $errors++;
            }
        }
        return response()->json(['imported' => $imported, 'skipped' => $skipped, 'errors' => $errors]);
    }

    public function usersUpdateRole(Request $request, $id)
    {
        $validated = $request->validate(['role' => 'required|in:student,advisor,staff,co_advisor']);
        $user = User::findOrFail($id);
        $user->update(['role' => $validated['role']]);
        return response()->json(['message' => 'Role updated.', 'user' => $user]);
    }

    public function usersDeactivate($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'inactive']);
        return response()->json(['message' => 'User deactivated.']);
    }

    public function usersRestore($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'active']);
        return response()->json(['message' => 'User restored.']);
    }

    public function usersDestroy($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'super_admin') return response()->json(['message' => 'Cannot delete super admin.'], 403);
        $user->delete();
        return response()->json(['message' => 'User permanently deleted.']);
    }

    /* ── Change Club Advisor ── */
    public function changeAdvisor(Request $request, $id)
    {
        $validated  = $request->validate(['advisor_id' => 'required|exists:users,id']);
        $club       = Club::findOrFail($id);
        $newAdvisor = User::findOrFail($validated['advisor_id']);

        $existingClub = Club::where('advisor_id', $validated['advisor_id'])
            ->where('status', 'active')
            ->where('id', '!=', $id)
            ->first();
        if ($existingClub) {
            return response()->json([
                'message' => 'This person is already the advisor of "' . $existingClub->name . '". Please choose someone else.'
            ], 422);
        }

        if ($club->advisor_id) {
            $oldAdvisor = User::find($club->advisor_id);
            if ($oldAdvisor) $oldAdvisor->update(['role' => 'student']);
        }

        $newAdvisor->update(['role' => 'advisor']);
        $club->update(['advisor_id' => $newAdvisor->id]);

        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($newAdvisor, $club) {
                $loginUrl = config('app.url') . '/login';
                $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e;'>
                    <p style='font-size: 15px; margin-bottom: 12px;'>Dear {$newAdvisor->name},</p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 12px;'>
                        You have been assigned as the advisor for <strong>{$club->name}</strong> at JNEC Club Management System.
                    </p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 24px;'>
                        Please login to the system to complete your club profile by adding the club's aim, objectives and description.
                    </p>
                    <p style='font-size: 15px; margin-bottom: 4px;'>Regards,</p>
                    <p style='font-size: 15px; font-weight: bold; margin-bottom: 32px;'>JNEC Club Management</p>
                    <div style='text-align: right;'>
                        <a href='{$loginUrl}' style='background-color: #172D3D; color: #c9a84c; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;'>Click here to login</a>
                    </div>
                </div>";
                $message->to($newAdvisor->email, $newAdvisor->name)
                    ->subject('You have been assigned as Club Advisor')
                    ->html($html);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Email failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Advisor changed successfully.']);
    }

    /* ── Super Admin Create Club + Assign Advisor ── */
    public function createClub(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'category'   => 'required|string',
            'advisor_id' => 'required|exists:users,id',
        ]);

        $existingClub = Club::where('advisor_id', $validated['advisor_id'])->where('status', 'active')->first();
        if ($existingClub) {
            return response()->json([
                'message' => 'This person is already the advisor of "' . $existingClub->name . '". Please choose someone else.'
            ], 422);
        }

        $club = Club::create([
            'name'       => $validated['name'],
            'category'   => $validated['category'],
            'status'     => 'active',
            'advisor_id' => $validated['advisor_id'],
        ]);

        $advisor = User::findOrFail($validated['advisor_id']);
        $advisor->update(['role' => 'advisor']);

        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($advisor, $club) {
                $loginUrl = config('app.url') . '/login';
                $html = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e;'>
                    <p style='font-size: 15px; margin-bottom: 12px;'>Dear {$advisor->name},</p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 12px;'>
                        You have been assigned as the advisor for <strong>{$club->name}</strong> at JNEC Club Management System.
                    </p>
                    <p style='font-size: 15px; line-height: 1.7; margin-bottom: 24px;'>
                        Please login to the system to complete your club profile by adding the club's aim, objectives and description.
                    </p>
                    <p style='font-size: 15px; margin-bottom: 4px;'>Regards,</p>
                    <p style='font-size: 15px; font-weight: bold; margin-bottom: 32px;'>JNEC Club Management</p>
                    <div style='text-align: right;'>
                        <a href='{$loginUrl}' style='background-color: #172D3D; color: #c9a84c; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;'>Click here to login</a>
                    </div>
                </div>";
                $message->to($advisor->email, $advisor->name)
                    ->subject('You have been assigned as Club Advisor')
                    ->html($html);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Advisor email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Club created and advisor assigned successfully.',
            'club'    => $club->load('advisor'),
        ], 201);
    }

    /* ══════════════════════════════════════════════════════
       SUPER ADMIN ATTENDANCE (read-only)
    ══════════════════════════════════════════════════════ */

    /**
     * GET /api/superadmin/attendance
     */
    public function attendanceIndex()
    {
        $clubs       = Club::where('status', 'active')->with('advisor:id,name')->get();
        $thisMonth   = now()->month;
        $thisYear    = now()->year;
        $activeCount = 0;

        $result = $clubs->map(function ($club) use ($thisMonth, $thisYear, &$activeCount) {
            $sessions      = \App\Models\AttendanceSession::where('club_id', $club->id)->get();
            $totalSessions = $sessions->count();

            $activeThisMonth = $sessions->contains(function ($s) use ($thisMonth, $thisYear) {
                $d = \Carbon\Carbon::parse($s->date);
                return $d->month === $thisMonth && $d->year === $thisYear;
            });
            if ($activeThisMonth) $activeCount++;

            $avgRate     = null;
            $lastSession = null;

            if ($totalSessions > 0) {
                $activeUserIds = \App\Models\ClubMember::where('club_id', $club->id)
                    ->where('status', '!=', 'removed')
                    ->pluck('user_id');
                $totalMembers = $activeUserIds->count();

                if ($totalMembers > 0) {
                    $rateSum = 0;
                    foreach ($sessions as $session) {
                        $absentCount  = \App\Models\AttendanceRecord::where('session_id', $session->id)
                            ->where('status', 'absent')
                            ->whereIn('user_id', $activeUserIds)
                            ->count();
                        $presentCount = $totalMembers - $absentCount;
                        $rateSum     += ($presentCount / $totalMembers) * 100;
                    }
                    $avgRate = round($rateSum / $totalSessions);
                }

                $lastSession = $sessions->sortByDesc('date')->first();
            }

            return [
                'id'             => $club->id,
                'name'           => $club->name,
                'category'       => $club->category,
                'advisor'        => $club->advisor->name ?? '—',
                'total_sessions' => $totalSessions,
                'avg_rate'       => $avgRate,
                'last_session'   => $lastSession ? $lastSession->date : null,
            ];
        });

        return response()->json([
            'clubs'        => $result,
            'total_clubs'  => $clubs->count(),
            'active_month' => $activeCount,
        ]);
    }

    /**
     * GET /api/superadmin/attendance/{clubId}
     */
    public function attendanceClub($clubId)
    {
        $club = Club::findOrFail($clubId);

        $activeUserIds = \App\Models\ClubMember::where('club_id', $clubId)
            ->where('status', '!=', 'removed')
            ->pluck('user_id');
        $totalMembers = $activeUserIds->count();

        $sessions = \App\Models\AttendanceSession::where('club_id', $clubId)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($session) use ($totalMembers, $activeUserIds) {
                $absentCount  = \App\Models\AttendanceRecord::where('session_id', $session->id)
                    ->where('status', 'absent')
                    ->whereIn('user_id', $activeUserIds)
                    ->count();
                $presentCount = $totalMembers - $absentCount;
                $rate         = $totalMembers > 0 ? round(($presentCount / $totalMembers) * 100) : 0;

                return [
                    'id'      => $session->id,
                    'name'    => $session->name,
                    'date'    => $session->date,
                    'total'   => $totalMembers,
                    'present' => $presentCount,
                    'absent'  => $absentCount,
                    'rate'    => $rate,
                ];
            });

        return response()->json([
            'club'          => ['id' => $club->id, 'name' => $club->name, 'category' => $club->category],
            'sessions'      => $sessions,
            'total_members' => $totalMembers,
        ]);
    }

    /**
     * GET /api/superadmin/attendance/{clubId}/session/{sessionId}
     */
    public function attendanceSession($clubId, $sessionId)
    {
        $club    = Club::findOrFail($clubId);
        $session = \App\Models\AttendanceSession::where('id', $sessionId)
            ->where('club_id', $clubId)
            ->firstOrFail();

        $totalSessions = \App\Models\AttendanceSession::where('club_id', $clubId)->count();

        $members = \App\Models\ClubMember::where('club_id', $clubId)
            ->where('status', '!=', 'removed')
            ->with('user:id,name,student_id,course,year')
            ->get()
            ->map(function ($m) use ($session, $clubId, $totalSessions) {
                if (!$m->user) return null;

                $record = \App\Models\AttendanceRecord::where('session_id', $session->id)
                    ->where('user_id', $m->user->id)
                    ->first();
                $status = $record ? $record->status : 'present';

                $absentTotal  = \App\Models\AttendanceRecord::where('user_id', $m->user->id)
                    ->where('status', 'absent')
                    ->whereHas('session', fn($q) => $q->where('club_id', $clubId))
                    ->count();
                $presentTotal = $totalSessions - $absentTotal;
                $overallPct   = $totalSessions > 0 ? round(($presentTotal / $totalSessions) * 100) : 0;

                return [
                    'id'          => $m->user->id,
                    'name'        => $m->user->name,
                    'student_id'  => $m->user->student_id ?? '—',
                    'course'      => $m->user->course ?? '—',
                    'year'        => $m->user->year ?? '—',
                    'status'      => $status,
                    'overall_pct' => $overallPct,
                ];
            })
            ->filter()
            ->values();

        $presentCount = $members->where('status', 'present')->count();
        $absentCount  = $members->where('status', 'absent')->count();
        $rate         = $members->count() > 0 ? round(($presentCount / $members->count()) * 100) : 0;

        return response()->json([
            'club'    => ['id' => $club->id, 'name' => $club->name],
            'session' => [
                'id'      => $session->id,
                'name'    => $session->name,
                'date'    => $session->date,
                'total'   => $members->count(),
                'present' => $presentCount,
                'absent'  => $absentCount,
                'rate'    => $rate,
            ],
            'members' => $members,
        ]);
    }
}