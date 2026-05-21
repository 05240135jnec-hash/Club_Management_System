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

// Public routes
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

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Club routes
    Route::get('/clubs/my-club', [ClubController::class, 'myClub']);
    Route::post('/clubs',        [ClubController::class, 'store']);

    // Enrollment key routes
    Route::get('/clubs/enrollment-key',    [EnrollmentController::class, 'show']);
    Route::put('/clubs/enrollment-key',    [EnrollmentController::class, 'update']);
    Route::delete('/clubs/enrollment-key', [EnrollmentController::class, 'revoke']);
    Route::post('/clubs/join',             [EnrollmentController::class, 'join']);

    // Member routes
    Route::get('/clubs/members',                 [MemberController::class, 'index']);
    Route::put('/clubs/members/bulk-remove',     [MemberController::class, 'bulkRemove']);
    Route::put('/clubs/members/{id}/remove',     [MemberController::class, 'remove']);
    Route::put('/clubs/members/{id}/restore',    [MemberController::class, 'restore']);
    Route::delete('/clubs/members/{id}',         [MemberController::class, 'destroy']);

    // Announcement routes
    Route::get('/announcements',         [AnnouncementController::class, 'index']);
    Route::post('/announcements',        [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}',    [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Report routes
    Route::get('/reports',              [ReportController::class, 'index']);
    Route::post('/reports',             [ReportController::class, 'store']);
    Route::put('/reports/{id}/forward', [ReportController::class, 'forward']);
    Route::delete('/reports/{id}',      [ReportController::class, 'destroy']);
    Route::post('/reports/secretary',   [ReportController::class, 'secretaryStore']);
    Route::get('/reports/dsa',          [ReportController::class, 'dsaIndex']);

    // Work Plan routes
    Route::get('/work-plans',         [WorkPlanController::class, 'index']);
    Route::post('/work-plans',        [WorkPlanController::class, 'store']);
    Route::delete('/work-plans/{id}', [WorkPlanController::class, 'destroy']);

    // Image Album routes
    Route::get('/image-albums',          [ImageAlbumController::class, 'index']);
    Route::post('/image-albums',         [ImageAlbumController::class, 'store']);
    Route::put('/image-albums/{id}',     [ImageAlbumController::class, 'update']);
    Route::delete('/image-albums/{id}',  [ImageAlbumController::class, 'destroy']);
    Route::delete('/album-images/{id}',  [ImageAlbumController::class, 'destroyImage']);

    // Blog routes
    Route::get('/blogs',           [BlogController::class, 'index']);
    Route::post('/blogs',          [BlogController::class, 'store']);
    Route::put('/blogs/{id}',      [BlogController::class, 'update']);
    Route::delete('/blogs/{id}',   [BlogController::class, 'destroy']);

    // Wildcard {id} routes — ALWAYS LAST
    Route::put('/clubs/{id}',      [ClubController::class, 'update']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
});