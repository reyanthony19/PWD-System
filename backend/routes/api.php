<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AttendanceController;

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

    /*
    |--------------------------------------------------------------------------
    | Event Routes
    |--------------------------------------------------------------------------
    */
    Route::apiResource('events', EventController::class);

    /*
    |--------------------------------------------------------------------------
    | Attendance Routes (Flat)
    |--------------------------------------------------------------------------
    */
    Route::get('/attendances', [AttendanceController::class, 'index']);   // list/filter
    Route::post('/attendances', [AttendanceController::class, 'store']); // add attendance
    Route::get('/attendances/{attendance}', [AttendanceController::class, 'show']); 
    Route::put('/attendances/{attendance}', [AttendanceController::class, 'update']);
    Route::delete('/attendances/{attendance}', [AttendanceController::class, 'destroy']);
});
