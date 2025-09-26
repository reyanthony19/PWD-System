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


// routes/api.php

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/staff/register', [StaffController::class, 'register']);
});

// Public Benefits (members can view benefits)

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
    Route::get('/user', [AuthController::class, 'profile']);
    Route::get('/user/documents/{user_id}', [AuthController::class, 'fetchMemberDocuments']);
    Route::get('/users', [AuthController::class, 'listUsers']);
    Route::get('/user/{id}', [AuthController::class, 'showUser']);
    Route::put('/user/{id}', [AuthController::class, 'updateUser']);
    Route::patch('/user/{id}/status', [AuthController::class, 'updateStatus']);
    Route::delete('/user/{id}', [AuthController::class, 'deleteUser']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Scanner from mobile app
    Route::get('/events/{event}/attendances', [AttendanceController::class, 'index']);
    Route::post('/events/{event}/attendances', [AttendanceController::class, 'store']);
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::get('/events/{eventId}/{userId}', [AttendanceController::class, 'checkUserAttendance']);


    // CRUD for events
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
    });
    /*
    |--------------------------------------------------------------------------
    | Benefits Management (Admin)
    |--------------------------------------------------------------------------
    */
    // CRUD for benefits
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
});
