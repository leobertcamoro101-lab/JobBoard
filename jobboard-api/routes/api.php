<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

// Jobs: browsing is public
Route::apiResource('jobs', JobController::class)->except(['store', 'update', 'destroy']);

// Applying is public (guests allowed; user_id is set when a token is sent)
Route::post('jobs/{job}/apply', [ApplicationController::class, 'store']);

// Auth: applicant signup (2-step)
Route::post('/applicant/register', [AuthController::class, 'registerApplicant'])->middleware('throttle:auth-register');
Route::post('/applicant/register/confirm', [AuthController::class, 'confirmApplicantRegistration'])->middleware('throttle:auth-confirm');

// Auth: employer signup (2-step)
Route::post('/employer/register', [AuthController::class, 'registerEmployer'])->middleware('throttle:auth-register');
Route::post('/employer/register/confirm', [AuthController::class, 'confirmEmployerRegistration'])->middleware('throttle:auth-confirm');

// Auth: shared
Route::post('/register/resend-code', [AuthController::class, 'resendCode'])->middleware('throttle:auth-resend');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile/password', [AuthController::class, 'changePassword'])->middleware('throttle:6,1');
    Route::post('/profile', [ProfileController::class, 'update']);

    // Employer: manage own jobs
    Route::post('jobs', [JobController::class, 'store']);
    Route::put('jobs/{job}', [JobController::class, 'update']);
    Route::delete('jobs/{job}', [JobController::class, 'destroy']);

    // Employer: see applicants and update their status
    Route::get('jobs/{job}/applications', [ApplicationController::class, 'index']);
    Route::patch('applications/{application}', [ApplicationController::class, 'updateStatus']);

    // Dashboards
    Route::get('/applicant/applications', [ApplicationController::class, 'myApplications']);
    Route::get('/employer/jobs', [JobController::class, 'myJobs']);
});