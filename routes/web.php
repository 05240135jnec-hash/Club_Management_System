<?php

use Illuminate\Support\Facades\Route;

Route::get('/auth/google/redirect', [\App\Http\Controllers\Api\GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [\App\Http\Controllers\Api\GoogleAuthController::class, 'callback']);

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');