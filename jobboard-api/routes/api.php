<?php

use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ApplicationController;
use Illuminate\Support\Facades\Route;

Route::apiResource('jobs', JobController::class);
Route::post('jobs/{job}/apply', [ApplicationController::class, 'store']);
Route::get('jobs/{job}/applications', [ApplicationController::class, 'index']);