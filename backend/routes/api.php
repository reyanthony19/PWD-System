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
|
| These routes are accessible without authentication.
| Typically used for login, registration, and public scans.
|
*/

// 🔐 Authentication (Public)
Route::post('/login', [AuthController::class, 'login']); // Admin/Staff login (web)
Route::post('/loginMobile', [AuthController::class, 'loginMobile']); // Mobile app login

// 👤 Member registration
Route::post('/member/register', [MemberController::class, 'register']); // Register new member
Route::get('/scanMember', [MemberController::class, 'scanMember']); // Scan member QR (public access)

/*
|--------------------------------------------------------------------------
| Protected Routes (Requires Authentication)
|--------------------------------------------------------------------------
|
| All routes within this group require a valid Sanctum token.
|
*/

// ✅ Member profile update (mobile app only)
Route::middleware('auth:sanctum')->put('/member/profile', [MemberController::class, 'updateMemberProfile']);

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | User & Staff Management
    |--------------------------------------------------------------------------
    */

    // 👥 Staff registration
    Route::post('/staff/register', [StaffController::class, 'register']); // Register new staff account

    // 🧑‍💼 Authenticated user actions
    Route::get('/user', [AuthController::class, 'profile']); // Get current logged-in user info
    Route::get('/user/documents/{user_id}', [AuthController::class, 'fetchMemberDocuments']); // Fetch member’s documents
    Route::get('/users', [AuthController::class, 'listUsers']); // Get list of all users
    Route::get('/user/{id}', [AuthController::class, 'showUser']); // View specific user details
    Route::put('/user/{id}', [AuthController::class, 'updateUser']); // Update user profile (used in mobile)
    Route::patch('/user/{id}/status', [AuthController::class, 'updateStatus']); // Update user active/inactive status
    Route::delete('/user/{id}', [AuthController::class, 'deleteUser']); // Delete user account
    Route::post('/logout', [AuthController::class, 'logout']); // Logout current user

    // 📄 Document hard copy check
    Route::put('/member-documents/{id}/hard-copy-status', [AuthController::class, 'updateHardCopyStatus']); // Update member’s hard copy status


    /*
    |--------------------------------------------------------------------------
    | Benefits Management
    |--------------------------------------------------------------------------
    |
    | Includes CRUD operations for benefits, benefit records, and participants.
    |
    */

    // 👨‍👩‍👧‍👦 Participants in a benefit
    Route::get('/benefits/{id}/participants', [BenefitController::class, 'getBenefitParticipants']); // Get all participants
    Route::post('/benefits/{benefitId}/participants', [BenefitController::class, 'addParticipants']); // Add participant(s)
    Route::delete('/benefits/{benefitId}/participants', [BenefitController::class, 'removeParticipants']); // Remove participant(s)

    // 🎁 Benefits CRUD
    Route::get('/benefits', [BenefitController::class, 'index']); // List all benefits
    Route::post('/benefits', [BenefitController::class, 'storeBenefit']); // Create new benefit
    Route::put('/benefits/{benefit}', [BenefitController::class, 'updateBenefit']); // Update existing benefit
    Route::delete('/benefits/{benefit}', [BenefitController::class, 'destroyBenefit']); // Delete a benefit
    Route::get('/benefits-lists', [BenefitController::class, 'listBenefits']); // Simple list for dropdowns
    Route::get('/benefits/{benefit}', [BenefitController::class, 'showBenefit']); // View benefit details
    Route::get('/benefits/{benefitId}/{userId}/claims', [BenefitController::class, 'checkUserClaim']); // Check if user has claimed benefit

    // 📋 Benefit records (per member)
    Route::get('/benefit-records', [BenefitController::class, 'indexRecords']); // List all benefit records
    Route::post('/benefit-records', [BenefitController::class, 'storeRecord']); // Create new benefit record
    Route::get('/benefit-records/{record}', [BenefitController::class, 'showRecord']); // Show single benefit record
    Route::put('/benefit-records/{record}', [BenefitController::class, 'updateRecord']); // Update record
    Route::delete('/benefit-records/{record}', [BenefitController::class, 'destroyRecord']); // Delete record
    Route::get('/users/{id}/benefits', [BenefitController::class, 'getUserBenefits']); // Get user’s benefits

    // 🎫 Benefit claims (scanner-based)
    Route::get('/benefits/{benefit}/claims', [BenefitController::class, 'indexClaims']); // Get all claims for benefit
    Route::post('/benefits/{benefit}/claims', [BenefitController::class, 'storeClaim']); // Store new benefit claim


    /*
    |--------------------------------------------------------------------------
    | Events & Attendance Management
    |--------------------------------------------------------------------------
    |
    | Includes events CRUD and attendance tracking for members and staff.
    |
    */

    // 📅 Events CRUD
    Route::get('/events', [EventController::class, 'index']); // List all events
    Route::get('/events/{event}', [EventController::class, 'show']); // Show single event
    Route::post('/events', [EventController::class, 'store']); // Create event
    Route::put('/events/{event}', [EventController::class, 'update']); // Update event
    Route::delete('/events/{event}', [EventController::class, 'destroy']); // Delete event

    // 🕓 Attendance Management
    Route::get('/events/{event}/attendances', [AttendanceController::class, 'index']); // Paginated event attendance list
    Route::get('/attendances/{eventId}', [AttendanceController::class, 'getEventAttendances']); // All attendances for event
    Route::post('/events/{event}/attendances', [AttendanceController::class, 'store']); // Scan QR / add attendance
    Route::post('/events/{eventId}/attendances/create', [AttendanceController::class, 'createAttendance']); // Create attendance manually
    Route::get('/attendances/{eventId}/user/{userId}', [AttendanceController::class, 'checkUserAttendance']); // Check if user attended
    Route::get('/users/{userId}/attendances', [AttendanceController::class, 'getUserAttendances']); // Get all attendances for user
    Route::post('/events/{eventId}/bulk-check-attendance', [AttendanceController::class, 'bulkCheckAttendance']); // Bulk check attendance
    Route::delete('/events/{eventId}/attendances/{attendance}', [AttendanceController::class, 'destroy']); // Delete specific attendance
    Route::delete('/events/{eventId}/users/{userId}/attendance', [AttendanceController::class, 'destroyByEventAndUser']); // Delete attendance by event/user
    Route::get('/attendances/{attendance}', [AttendanceController::class, 'show']); // Show attendance details
    Route::put('/attendances/{attendance}', [AttendanceController::class, 'update']); // Update attendance
});
