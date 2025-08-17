<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\MemberController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Admin login/register
Route::post('/register', [AuthController::class, 'register']); // only Admin
Route::post('/login', [AuthController::class, 'login']);

// Member registration
Route::post('/member/register', [MemberController::class, 'register']);

// Staff registration
Route::post('/staff/register', [StaffController::class, 'register']);


/*
|--------------------------------------------------------------------------
| Protected Routes (requires authentication)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Common user endpoints
    Route::get('/user', [AuthController::class, 'profile']);
    Route::get('/users', [AuthController::class, 'listUsers']);
    Route::get('/user/{id}', [AuthController::class, 'showUser']);
    Route::put('/user/{id}', [AuthController::class, 'updateUser']);
    Route::patch('/user/{id}/status', [AuthController::class, 'updateStatus']);
    Route::delete('/user/{id}', [AuthController::class, 'deleteUser']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
