<?php

namespace Tests;

use App\Models\ApplicantProfile;
use App\Models\Application;
use App\Models\EmployerProfile;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * RefreshDatabase runs migrate:fresh. Make sure it can only ever hit a local *_test database.
     */
    protected function setUpTraits()
    {
        $config = config('database.connections.' . config('database.default'));
        $database = (string) ($config['database'] ?? '');
        $host = (string) ($config['host'] ?? '');

        if (! str_ends_with($database, '_test') || ! in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
            throw new \RuntimeException(
                "Refusing to run tests against database '{$database}' on host '{$host}'. " .
                "Tests must use a local database whose name ends in _test."
            );
        }

        return parent::setUpTraits();
    }

    protected function makeEmployer(array $attributes = [], string $company = 'Acme Corp'): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 'employer',
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'mobile_number' => '09170000001',
        ], $attributes));

        EmployerProfile::create(['user_id' => $user->id, 'company_name' => $company]);

        return $user;
    }

    protected function makeApplicant(array $attributes = [], bool $allowView = true): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 'applicant',
            'first_name' => 'App',
            'last_name' => 'Licant',
            'mobile_number' => '09170000002',
        ], $attributes));

        ApplicantProfile::create([
            'user_id' => $user->id,
            'resume_path' => 'resumes/test.pdf',
            'allow_view' => $allowView,
        ]);

        return $user;
    }

    protected function makeJob(?User $employer = null, array $attributes = []): Job
    {
        return Job::create(array_merge([
            'title' => 'Test Job',
            'company' => 'Acme Corp',
            'location' => 'Cebu City',
            'type' => 'full-time',
            'category' => 'Engineering',
            'description' => str_repeat('Build great things. ', 6),
            'apply_email' => 'jobs@acme.test',
            'is_active' => true,
            'employer_id' => $employer?->id,
        ], $attributes));
    }

    protected function makeApplication(Job $job, ?User $applicant = null, array $attributes = []): Application
    {
        return Application::create(array_merge([
            'job_id' => $job->id,
            'user_id' => $applicant?->id,
            'name' => $applicant?->name ?? 'Guest Person',
            'email' => $applicant?->email ?? 'guest' . uniqid() . '@example.test',
            'cover_letter' => str_repeat('I am a great fit. ', 8),
            'status' => 'pending',
        ], $attributes));
    }

    protected function jobPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Senior Developer',
            'company' => 'Acme Corp',
            'location' => 'Cebu City',
            'type' => 'full-time',
            'category' => 'Engineering',
            'description' => str_repeat('Build great things. ', 6),
            'apply_email' => 'jobs@acme.test',
        ], $overrides);
    }

    protected function coverLetter(): string
    {
        return str_repeat('I am a great fit. ', 8);
    }
}
