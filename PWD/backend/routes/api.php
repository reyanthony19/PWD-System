<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\API\AuthController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/users', [AuthController::class, 'listUsers']);
Route::get('/user/{id}', [AuthController::class, 'showUser']);
Route::put('/user/{id}', [AuthController::class, 'updateUser']);

// Protected Route for current authenticated user profile
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
