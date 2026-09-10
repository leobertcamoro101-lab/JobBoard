<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function store(Request $request, Job $job)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email',
            'cover_letter' => 'required|string|min:100',
            'phone'        => 'nullable|string',
            'linkedin'     => 'nullable|url',
            'portfolio'    => 'nullable|url',
        ]);

        // Check for duplicate application
        $exists = Application::where('job_id', $job->id)
            ->where('email', $request->email)
            ->exists();

        if ($exists) {
            return response()->json(
                ['message' => 'You have already applied for this job'],
                422
            );
        }

        $application = Application::create([
            ...$request->all(),
            'job_id' => $job->id,
        ]);

        return response()->json($application, 201);
    }

    public function index(Job $job)
    {
        return response()->json(
            $job->applications()->orderBy('created_at', 'desc')->get()
        );
    }
}
