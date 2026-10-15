<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplicantAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_a_jobs_applicants(): void
    {
        $job = $this->makeJob($this->makeEmployer());

        $this->getJson("/api/jobs/{$job->id}/applications")->assertUnauthorized();
    }

    public function test_applicants_cannot_view_a_jobs_applicants(): void
    {
        $job = $this->makeJob($this->makeEmployer());
        Sanctum::actingAs($this->makeApplicant());

        $this->getJson("/api/jobs/{$job->id}/applications")->assertForbidden();
    }

    public function test_employers_cannot_view_applicants_of_other_employers_jobs(): void
    {
        $job = $this->makeJob($this->makeEmployer());
        $this->makeApplication($job);
        Sanctum::actingAs($this->makeEmployer());

        $this->getJson("/api/jobs/{$job->id}/applications")->assertForbidden();
    }

    public function test_the_owner_can_view_applicants(): void
    {
        $employer = $this->makeEmployer();
        $job = $this->makeJob($employer);
        $this->makeApplication($job, null, ['name' => 'Jane Doe']);
        Sanctum::actingAs($employer);

        $this->getJson("/api/jobs/{$job->id}/applications")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', 'Jane Doe');
    }

    public function test_resume_link_is_shown_only_when_the_applicant_allows_it(): void
    {
        $employer = $this->makeEmployer();
        $job = $this->makeJob($employer);

        $visible = $this->makeApplicant(['email' => 'visible@example.test'], true);
        $hidden = $this->makeApplicant(['email' => 'hidden@example.test'], false);
        $this->makeApplication($job, $visible);
        $this->makeApplication($job, $hidden);
        Sanctum::actingAs($employer);

        $rows = collect($this->getJson("/api/jobs/{$job->id}/applications")->assertOk()->json());

        $this->assertStringContainsString('resumes/test.pdf', (string) $rows->firstWhere('email', 'visible@example.test')['resume_url']);
        $this->assertNull($rows->firstWhere('email', 'hidden@example.test')['resume_url']);
    }

    public function test_the_owner_can_change_an_application_status(): void
    {
        $employer = $this->makeEmployer();
        $application = $this->makeApplication($this->makeJob($employer));
        Sanctum::actingAs($employer);

        $this->patchJson("/api/applications/{$application->id}", ['status' => 'accepted'])->assertOk();

        $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'accepted']);
    }

    public function test_an_invalid_status_is_rejected(): void
    {
        $employer = $this->makeEmployer();
        $application = $this->makeApplication($this->makeJob($employer));
        Sanctum::actingAs($employer);

        $this->patchJson("/api/applications/{$application->id}", ['status' => 'hired'])->assertStatus(422);

        $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'pending']);
    }

    public function test_other_employers_and_applicants_cannot_change_a_status(): void
    {
        $application = $this->makeApplication($this->makeJob($this->makeEmployer()));

        Sanctum::actingAs($this->makeEmployer());
        $this->patchJson("/api/applications/{$application->id}", ['status' => 'accepted'])->assertForbidden();

        Sanctum::actingAs($this->makeApplicant());
        $this->patchJson("/api/applications/{$application->id}", ['status' => 'accepted'])->assertForbidden();

        $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'pending']);
    }
}