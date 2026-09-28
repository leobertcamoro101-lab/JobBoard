<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ApplicationController;
use Illuminate\Support\Facades\Route;

// Jobs — browsing is public, no auth required
Route::apiResource('jobs', JobController::class)->except(['store', 'update', 'destroy']);
Route::get('jobs/{job}/applications', [ApplicationController::class, 'index']);

// Applying to a job — public (guest applicants allowed; user_id is null if not logged in)
Route::post('jobs/{job}/apply', [ApplicationController::class, 'store']);

// Auth — applicant signup (2-step)
Route::post('/applicant/register', [AuthController::class, 'registerApplicant']);
Route::post('/applicant/register/confirm', [AuthController::class, 'confirmApplicantRegistration']);

// Auth — employer signup (2-step)
Route::post('/employer/register', [AuthController::class, 'registerEmployer']);
Route::post('/employer/register/confirm', [AuthController::class, 'confirmEmployerRegistration']);

// Auth — shared
Route::post('/register/resend-code', [AuthController::class, 'resendCode']);
Route::post('/login', [AuthController::class, 'login']);

// Everything below requires a valid Sanctum token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Jobs — posting/editing/deleting requires auth (employer_id set from the token)
    Route::post('jobs', [JobController::class, 'store']);
    Route::put('jobs/{job}', [JobController::class, 'update']);
    Route::delete('jobs/{job}', [JobController::class, 'destroy']);

    // Dashboards
    Route::get('/applicant/applications', [ApplicationController::class, 'myApplications']);
    Route::get('/employer/jobs', [JobController::class, 'myJobs']);
});