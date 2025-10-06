<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\BenefitController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Admin login/register
Route::post('/login', [AuthController::class, 'login']);

// Member registration
Route::post('/member/register', [MemberController::class, 'register']);

Route::get('/scanMember', [MemberController::class, 'scanMember']);

/*
|--------------------------------------------------------------------------
| Protected Routes (requires authentication)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->put('/member/profile', [MemberController::class, 'updateMemberProfile']);

Route::middleware('auth:sanctum')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Authenticated User Management
    |--------------------------------------------------------------------------
    */
    
    // Staff registration
    Route::post('/staff/register', [StaffController::class, 'register']);
    
    Route::get('/user', [AuthController::class, 'profile']);
    Route::get('/user/documents/{user_id}', [AuthController::class, 'fetchMemberDocuments']);
    Route::get('/users', [AuthController::class, 'listUsers']);
    Route::get('/user/{id}', [AuthController::class, 'showUser']);
    Route::put('/user/{id}', [AuthController::class, 'updateUser']);
    Route::patch('/user/{id}/status', [AuthController::class, 'updateStatus']);
    Route::delete('/user/{id}', [AuthController::class, 'deleteUser']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Benefits Management
    |--------------------------------------------------------------------------
    */
    
    // ✅ Benefit Participants Management
    Route::get('/benefits/{id}/participants', [BenefitController::class, 'getBenefitParticipants']);
    Route::post('/benefits/{benefitId}/participants', [BenefitController::class, 'addParticipants']);
    Route::delete('/benefits/{benefitId}/participants', [BenefitController::class, 'removeParticipants']);

    // CRUD for benefits
    Route::get('/benefits', [BenefitController::class, 'index']);
    Route::post('/benefits', [BenefitController::class, 'storeBenefit']);
    Route::put('/benefits/{benefit}', [BenefitController::class, 'updateBenefit']);
    Route::delete('/benefits/{benefit}', [BenefitController::class, 'destroyBenefit']);
    Route::get('/benefits-lists', [BenefitController::class, 'listBenefits']);
    Route::get('/benefits/{benefit}', [BenefitController::class, 'showBenefit']);
    Route::get('/benefits/{benefitId}/{userId}/claims', [BenefitController::class, 'checkUserClaim']);

    // CRUD for benefit records
    Route::get('/benefit-records', [BenefitController::class, 'indexRecords']);
    Route::post('/benefit-records', [BenefitController::class, 'storeRecord']);
    Route::get('/benefit-records/{record}', [BenefitController::class, 'showRecord']);
    Route::put('/benefit-records/{record}', [BenefitController::class, 'updateRecord']);
    Route::delete('/benefit-records/{record}', [BenefitController::class, 'destroyRecord']);

    // Scanner + claims for benefits
    Route::get('/benefits/{benefit}/claims', [BenefitController::class, 'indexClaims']);
    Route::post('/benefits/{benefit}/claims', [BenefitController::class, 'storeClaim']);

    /*
    |--------------------------------------------------------------------------
    | Events & Attendance Management
    |--------------------------------------------------------------------------
    */
    
    // Events
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);

    // Attendance
    Route::get('/events/{event}/attendances', [AttendanceController::class, 'index']);
    Route::get('/attendances/{eventId}', [AttendanceController::class, 'getEventAttendances']);
    Route::post('/events/{event}/attendances', [AttendanceController::class, 'store']);
    Route::post('/events/{eventId}/attendances/create', [AttendanceController::class, 'createAttendance']);
    Route::get('/attendances/{eventId}/user/{userId}', [AttendanceController::class, 'checkUserAttendance']);
    Route::get('/users/{userId}/attendances', [AttendanceController::class, 'getUserAttendances']);
    Route::post('/events/{eventId}/bulk-check-attendance', [AttendanceController::class, 'bulkCheckAttendance']);
    Route::delete('/events/{eventId}/attendances/{attendance}', [AttendanceController::class, 'destroy']);
    Route::delete('/events/{eventId}/users/{userId}/attendance', [AttendanceController::class, 'destroyByEventAndUser']);
    Route::get('/attendances/{attendance}', [AttendanceController::class, 'show']);
    Route::put('/attendances/{attendance}', [AttendanceController::class, 'update']);
});