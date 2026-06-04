<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AdvisorController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\WorkPlanController;
use App\Http\Controllers\Api\ImageAlbumController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\InviteAdvisorController;
use App\Http\Controllers\Api\SecretaryController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\SuperAdminClubController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\AuditFeedbackController;
use App\Http\Controllers\Api\TransferClubController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\CertificateController;


// ════════════════════════════════════════
// PUBLIC ROUTES — no login required
// ════════════════════════════════════════
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
Route::get('/public/clubs/{id}/albums', [PublicController::class, 'getClubAlbums']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/clubs',             [ClubController::class, 'index']);
Route::get('/clubs/by-category', [ClubController::class, 'byCategory']);

Route::get('/categories',         [CategoryController::class, 'index']);
Route::post('/categories',        [CategoryController::class, 'store']);
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

Route::get('/advisors',              [AdvisorController::class, 'index']);
Route::put('/advisors/{id}/approve', [AdvisorController::class, 'approve']);
Route::put('/advisors/{id}/reject',  [AdvisorController::class, 'reject']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('/reset-password',  [PasswordResetController::class, 'resetPassword']);


// ════════════════════════════════════════
// PROTECTED ROUTES — login required
// ════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/club/co-advisors',      [TransferClubController::class, 'coAdvisors']);
    Route::post('/club/appoint-advisor', [TransferClubController::class, 'appoint']);
    Route::get('/notifications',           [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all',  [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications',        [NotificationController::class, 'clearAll']);

    // ── Club ──
    Route::get('/clubs/my-club', [ClubController::class, 'myClub']);
    Route::post('/clubs',        [ClubController::class, 'store']);

    // ── Enrollment Key ──
    Route::get('/clubs/enrollment-key',    [EnrollmentController::class, 'show']);
    Route::put('/clubs/enrollment-key',    [EnrollmentController::class, 'update']);
    Route::delete('/clubs/enrollment-key', [EnrollmentController::class, 'revoke']);
    Route::post('/clubs/enrollment-key/generate', [EnrollmentController::class, 'generate']);
    Route::post('/clubs/join',             [EnrollmentController::class, 'join']);

    // ── Members ──
    Route::get('/clubs/members',             [MemberController::class, 'index']);
    Route::put('/clubs/members/bulk-remove', [MemberController::class, 'bulkRemove']);
    Route::put('/clubs/members/{id}/remove', [MemberController::class, 'remove']);
    Route::put('/clubs/members/{id}/restore',[MemberController::class, 'restore']);
    Route::delete('/clubs/members/{id}',     [MemberController::class, 'destroy']);
    Route::put('/clubs/members/{id}/year',   [MemberController::class, 'updateYear']);

    // ── Announcements ──
    Route::get('/announcements',         [AnnouncementController::class, 'index']);
    Route::post('/announcements',        [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}',    [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // ── Reports ──
    Route::get('/reports',              [ReportController::class, 'index']);
    Route::post('/reports',             [ReportController::class, 'store']);
    Route::put('/reports/{id}/forward', [ReportController::class, 'forward']);
    Route::put('/reports/{id}',         [ReportController::class, 'update']);
    Route::delete('/reports/{id}',      [ReportController::class, 'destroy']);
    Route::post('/reports/secretary',   [ReportController::class, 'secretaryStore']);
    Route::get('/reports/dsa',          [ReportController::class, 'dsaIndex']);
    Route::get('/reports/audit',        [ReportController::class, 'auditIndex']);

    // ── Audit Feedback ──
    Route::post('/audit-reports/{reportId}/feedback', [AuditFeedbackController::class, 'store']);
    Route::get('/audit-reports/{reportId}/feedback',  [AuditFeedbackController::class, 'index']);
    Route::get('/student/announcements', [AnnouncementController::class, 'studentIndex']);
    Route::get('/advisor/announcements', [AnnouncementController::class, 'advisorIndex']);

    // ── Work Plans ──
    Route::get('/work-plans',         [WorkPlanController::class, 'index']);
    Route::post('/work-plans',        [WorkPlanController::class, 'store']);
    Route::put('/work-plans/{id}',    [WorkPlanController::class, 'update']);
    Route::delete('/work-plans/{id}', [WorkPlanController::class, 'destroy']);

    // ── Image Albums ──
    Route::get('/image-albums',         [ImageAlbumController::class, 'index']);
    Route::post('/image-albums',        [ImageAlbumController::class, 'store']);
    Route::put('/image-albums/{id}',    [ImageAlbumController::class, 'update']);
    Route::delete('/image-albums/{id}', [ImageAlbumController::class, 'destroy']);
    Route::delete('/album-images/{id}', [ImageAlbumController::class, 'destroyImage']);

    // ── Blogs ──
    Route::get('/blogs',         [BlogController::class, 'index']);
    Route::post('/blogs',        [BlogController::class, 'store']);
    Route::put('/blogs/{id}',    [BlogController::class, 'update']);
    Route::delete('/blogs/{id}', [BlogController::class, 'destroy']);

    // ── Attendance ──
    Route::get('/attendance',            [AttendanceController::class, 'index']);
    Route::post('/attendance',           [AttendanceController::class, 'store']);
    Route::get('/attendance/{id}',       [AttendanceController::class, 'show']);
    Route::put('/attendance/{id}',       [AttendanceController::class, 'update']);
    Route::post('/attendance/{id}/save', [AttendanceController::class, 'save']);
    Route::delete('/attendance/{id}',    [AttendanceController::class, 'destroy']);

    // ── Wildcard club/category update ──
    Route::put('/clubs/{id}',      [ClubController::class, 'update']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);

    // ── Advisor Invitations (protected) ──
    Route::get('/invitations',                    [InviteAdvisorController::class, 'index']);
    Route::get('/invitations/available',          [InviteAdvisorController::class, 'available']);
    Route::post('/invitations/add',               [InviteAdvisorController::class, 'add']);
    Route::post('/invitations/send',              [InviteAdvisorController::class, 'send']);
    Route::delete('/invitations/{id}',            [InviteAdvisorController::class, 'cancel']);
    Route::delete('/co-advisors/{userId}/revoke', [InviteAdvisorController::class, 'revoke']);

    // ── Secretary Management ──
    Route::get('/secretary',                 [SecretaryController::class, 'index']);
        Route::get('/secretary/available-users', [SecretaryController::class, 'availableUsers']);
    Route::post('/secretary/assign',     [SecretaryController::class, 'assign']);
    Route::put('/secretary/{id}/remove', [SecretaryController::class, 'remove']);

    // ── Profile ──
    Route::get('/profile',            [ProfileController::class, 'show']);
    Route::post('/profile',           [ProfileController::class, 'update']);
    Route::put('/profile/password',   [ProfileController::class, 'changePassword']);
    Route::post('/profile/signature', [ProfileController::class, 'updateSignature']);

    // ── Certificate ──
    Route::get('/certificate/student/{clubId}', [CertificateController::class, 'studentEligibility']);
    Route::get('/certificate/secretary',        [CertificateController::class, 'secretaryEligibility']);
    Route::get('/secretary/my-club', [SecretaryController::class, 'myClub']);

    // ════════════════════════════════════════
    // SUPER ADMIN ROUTES
    // ════════════════════════════════════════
    Route::prefix('superadmin')->group(function () {
        Route::get('/clubs',                   [SuperAdminClubController::class, 'index']);
        Route::post('/clubs/create',           [SuperAdminClubController::class, 'createClub']);
        Route::get('/clubs/{id}',              [SuperAdminClubController::class, 'show']);
        Route::put('/clubs/{id}',              [SuperAdminClubController::class, 'update']);
        Route::get('/clubs/{id}/albums',       [SuperAdminClubController::class, 'albums']);
        Route::put('/clubs/{id}/deactivate',   [SuperAdminClubController::class, 'deactivate']);
        Route::put('/clubs/{id}/restore',      [SuperAdminClubController::class, 'restore']);
        Route::delete('/clubs/{id}',           [SuperAdminClubController::class, 'destroy']);
        Route::delete('/advisors/{id}',        [SuperAdminClubController::class, 'destroyAdvisor']);
        Route::put('/clubs/{id}/features',     [SuperAdminClubController::class, 'updateFeatures']);
        Route::put('/clubs/{id}/change-advisor', [SuperAdminClubController::class, 'changeAdvisor']);
        Route::get('/reports',                 [SuperAdminClubController::class, 'reportsIndex']);
        Route::delete('/reports/{id}',         [SuperAdminClubController::class, 'reportsDestroy']);
        Route::get('/announcements',           [SuperAdminClubController::class, 'announcementsIndex']);
        Route::post('/announcements',          [SuperAdminClubController::class, 'announcementsStore']);
        Route::post('/announcements/{id}',     [SuperAdminClubController::class, 'announcementsUpdate']);
        Route::delete('/announcements/{id}',   [SuperAdminClubController::class, 'announcementsDestroy']);
        Route::get('/settings',  [SystemSettingController::class, 'index']);
        Route::put('/settings',  [SystemSettingController::class, 'update']);
        Route::post('/certificate/template',   [SystemSettingController::class, 'uploadTemplate']);
        Route::delete('/certificate/template', [SystemSettingController::class, 'deleteTemplate']);
        // User Management
        Route::get('/users',                  [SuperAdminClubController::class, 'usersIndex']);
        Route::post('/users',                 [SuperAdminClubController::class, 'usersStore']);
        Route::post('/users/bulk',            [SuperAdminClubController::class, 'usersBulk']);
        Route::put('/users/{id}',             [SuperAdminClubController::class, 'usersUpdate']);
        Route::put('/users/{id}/role',        [SuperAdminClubController::class, 'usersUpdateRole']);
        Route::put('/users/{id}/deactivate',  [SuperAdminClubController::class, 'usersDeactivate']);
        Route::put('/users/{id}/restore',     [SuperAdminClubController::class, 'usersRestore']);
        Route::delete('/users/{id}',          [SuperAdminClubController::class, 'usersDestroy']);
        // Attendance (read-only)
        Route::get('/attendance',                              [SuperAdminClubController::class, 'attendanceIndex']);
        Route::get('/attendance/{clubId}',                     [SuperAdminClubController::class, 'attendanceClub']);
        Route::get('/attendance/{clubId}/session/{sessionId}', [SuperAdminClubController::class, 'attendanceSession']);
    });
    Route::get('/student/my-clubs',                          [StudentController::class, 'myClubs']);
    Route::get('/student/clubs/{id}/albums',                 [StudentController::class, 'clubAlbums']);
    Route::get('/student/clubs/{id}/announcements',          [StudentController::class, 'announcements']);
    Route::get('/student/clubs/{id}/members',                [StudentController::class, 'clubMembers']);
    Route::get('/student/clubs/{id}/work-plans',             [StudentController::class, 'clubWorkPlans']);
    Route::get('/student/clubs/{id}/blogs',                  [StudentController::class, 'clubBlogs']);
    Route::get('/student/dashboard/{clubId}',                [StudentController::class, 'dashboard']);
    Route::get('/student/clubs/{clubId}/announcements/{id}', [StudentController::class, 'announcementDetail']);
    Route::get('/student/clubs/{id}/my-attendance',          [StudentController::class, 'myAttendance']);
    Route::get('/student/clubs/{id}/attendance',             [StudentController::class, 'clubAttendance']);

});