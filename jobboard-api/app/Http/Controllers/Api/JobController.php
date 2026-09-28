<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request)
    {
        $query = Job::withCount('applications')->where('is_active', true);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ilike', "%{$request->search}%")
                  ->orWhere('company', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->location) {
            $query->where('location', 'ilike', "%{$request->location}%");
        }

        $jobs = $query->orderBy('created_at', 'desc')->get();

        return response()->json($jobs);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'company'      => 'required|string|max:255',
            'location'     => 'required|string|max:255',
            'type'         => 'required|in:full-time,part-time,remote,contract',
            'description'  => 'required|string',
            'apply_email'  => 'required|email',
            'category'     => 'required|string',
            'salary_min'   => 'nullable|numeric',
            'salary_max'   => 'nullable|numeric',
            'currency'     => 'nullable|string',
            'requirements' => 'nullable|string',
        ]);

        $data['employer_id'] = $request->user()->id;
        $data['is_active'] = true;

        $job = Job::create($data);

        return response()->json($job, 201);
    }

    public function show(Job $job)
    {
        return response()->json(
            $job->loadCount('applications')
        );
    }

    public function update(Request $request, Job $job)
    {
        if ($job->employer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'company'      => 'sometimes|string|max:255',
            'location'     => 'sometimes|string|max:255',
            'type'         => 'sometimes|in:full-time,part-time,remote,contract',
            'description'  => 'sometimes|string',
            'apply_email'  => 'sometimes|email',
            'category'     => 'sometimes|string',
            'salary_min'   => 'nullable|numeric',
            'salary_max'   => 'nullable|numeric',
            'currency'     => 'nullable|string',
            'requirements' => 'nullable|string',
            'is_active'    => 'sometimes|boolean',
        ]);

        $job->update($data);

        return response()->json($job);
    }

    public function destroy(Request $request, Job $job)
    {
        if ($job->employer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $job->delete();

        return response()->json(['message' => 'Job deleted']);
    }

    public function myJobs(Request $request)
    {
        return $request->user()
            ->jobs()
            ->withCount('applications as applicants_count')
            ->latest()
            ->get();
    }
}