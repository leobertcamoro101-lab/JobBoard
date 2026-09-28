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
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email',
            'cover_letter' => 'required|string|min:100',
            'phone'        => 'nullable|string',
            'linkedin'     => 'nullable|url',
            'portfolio'    => 'nullable|url',
        ]);

        $exists = Application::where('job_id', $job->id)
            ->where('email', $data['email'])
            ->exists();

        if ($exists) {
            return response()->json(
                ['message' => 'You have already applied for this job'],
                422
            );
        }

        $application = Application::create([
            ...$data,
            'job_id' => $job->id,
            'user_id' => $request->user()?->id,
            'status' => 'pending',
        ]);

        return response()->json($application, 201);
    }

    public function index(Job $job)
    {
        return response()->json(
            $job->applications()->orderBy('created_at', 'desc')->get()
        );
    }

    public function myApplications(Request $request)
    {
        return $request->user()
            ->applications()
            ->with('job:id,title,company')
            ->latest()
            ->get()
            ->map(fn ($app) => [
                'id' => $app->id,
                'job_id' => $app->job_id,
                'job_title' => $app->job->title,
                'company' => $app->job->company,
                'status' => $app->status,
                'created_at' => $app->created_at,
            ]);
    }
}