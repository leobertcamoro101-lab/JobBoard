<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    /**
     * Display a listing of the resource.
     */
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

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'company'     => 'required|string|max:255',
            'location'    => 'required|string|max:255',
            'type'        => 'required|in:full-time,part-time,remote,contract',
            'description' => 'required|string',
            'apply_email' => 'required|email',
            'category'    => 'required|string',
        ]);

        $job = Job::create($request->all());

        return response()->json($job, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Job $job)
    {
        return response()->json(
            $job->loadCount('applications')
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Job $job)
    {
        $job->update($request->all());
        return response()->json($job);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Job $job)
    {
        $job->delete();
        return response()->json(['message' => 'Job deleted']);
    }
}
