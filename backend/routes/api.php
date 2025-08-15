<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// User management (can filter by role)
Route::get('/users', [AuthController::class, 'listUsers']);
Route::get('/user/{id}', [AuthController::class, 'showUser']);

// Protected Routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'profile']);   // Current authenticated user's profile
    Route::put('/user/{id}', [AuthController::class, 'updateUser']);
    Route::post('/logout', [AuthController::class, 'logout']); // Logout
});
