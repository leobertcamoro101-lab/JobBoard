<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    private function ownsJob(Request $request, Job $job): bool
    {
        return $job->employer_id !== null
            && (int) $job->employer_id === (int) $request->user()->id;
    }

    public function store(Request $request, Job $job)
    {
        if (! $job->is_active) {
            return response()->json(
                ['message' => 'This job is no longer accepting applications'],
                422
            );
        }

        // Logged-in applicants apply as themselves; everyone else applies as a guest
        $user = $request->user('sanctum');
        $isApplicant = $user && $user->role === 'applicant';

        $rules = [
            'cover_letter' => 'required|string|min:100',
            'phone'        => 'nullable|string',
            'linkedin'     => 'nullable|url',
            'portfolio'    => 'nullable|url',
        ];

        if (! $isApplicant) {
            $rules['name'] = 'required|string|max:255';
            $rules['email'] = 'required|email';
        }

        $data = $request->validate($rules);

        if ($isApplicant) {
            // Always trust the account, never the request body
            $data['name'] = $user->name;
            $data['email'] = $user->email;
        }

        $duplicate = Application::where('job_id', $job->id)
            ->where(function ($q) use ($data, $isApplicant, $user) {
                $q->where('email', $data['email']);
                if ($isApplicant) {
                    $q->orWhere('user_id', $user->id);
                }
            })
            ->exists();

        if ($duplicate) {
            return response()->json(
                ['message' => 'You have already applied for this job'],
                422
            );
        }

        $application = Application::create([
            ...$data,
            'job_id' => $job->id,
            'user_id' => $isApplicant ? $user->id : null,
            'status' => 'pending',
        ]);

        return response()->json($application, 201);
    }

    // Employer only: applicants for one of their own jobs
    public function index(Request $request, Job $job)
    {
        if (! $this->ownsJob($request, $job)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $job->applications()
            ->with('user.applicantProfile')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($app) {
                $profile = $app->user?->applicantProfile;

                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'email' => $app->email,
                    'phone' => $app->phone,
                    'linkedin' => $app->linkedin,
                    'portfolio' => $app->portfolio,
                    'cover_letter' => $app->cover_letter,
                    'status' => $app->status,
                    'created_at' => $app->created_at,
                    // Only shared when the applicant ticked "Allow companies to view my resume"
                    'resume_url' => ($profile && $profile->allow_view) ? $profile->resume_url : null,
                ];
            });
    }

    // Employer only: move an application to reviewed / accepted / rejected
    public function updateStatus(Request $request, Application $application)
    {
        if (! $this->ownsJob($request, $application->job)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'status' => 'required|in:pending,reviewed,accepted,rejected',
        ]);

        $application->update($data);

        return response()->json([
            'id' => $application->id,
            'status' => $application->status,
        ]);
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