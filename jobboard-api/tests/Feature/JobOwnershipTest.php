<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JobOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_create_jobs(): void
    {
        $this->postJson('/api/jobs', $this->jobPayload())->assertUnauthorized();
    }

    public function test_applicants_cannot_create_jobs(): void
    {
        Sanctum::actingAs($this->makeApplicant());

        $this->postJson('/api/jobs', $this->jobPayload())->assertForbidden();
        $this->assertDatabaseCount('job_listings', 0);
    }

    public function test_employers_can_create_jobs_and_own_them(): void
    {
        $employer = $this->makeEmployer();
        Sanctum::actingAs($employer);

        $this->postJson('/api/jobs', $this->jobPayload())->assertCreated();

        $this->assertDatabaseHas('job_listings', [
            'title' => 'Senior Developer',
            'employer_id' => $employer->id,
            'is_active' => true,
        ]);
    }

    public function test_employer_id_in_the_request_body_is_ignored(): void
    {
        $employer = $this->makeEmployer();
        $other = $this->makeEmployer();
        Sanctum::actingAs($employer);

        $this->postJson('/api/jobs', $this->jobPayload(['employer_id' => $other->id]))->assertCreated();

        $this->assertDatabaseHas('job_listings', ['title' => 'Senior Developer', 'employer_id' => $employer->id]);
        $this->assertDatabaseMissing('job_listings', ['employer_id' => $other->id]);
    }

    public function test_employers_can_update_their_own_jobs(): void
    {
        $employer = $this->makeEmployer();
        $job = $this->makeJob($employer);
        Sanctum::actingAs($employer);

        $this->putJson("/api/jobs/{$job->id}", ['title' => 'Renamed'])->assertOk();

        $this->assertDatabaseHas('job_listings', ['id' => $job->id, 'title' => 'Renamed']);
    }

    public function test_employers_cannot_update_other_employers_jobs(): void
    {
        $owner = $this->makeEmployer();
        $intruder = $this->makeEmployer();
        $job = $this->makeJob($owner);
        Sanctum::actingAs($intruder);

        $this->putJson("/api/jobs/{$job->id}", ['title' => 'Hijacked'])->assertForbidden();

        $this->assertDatabaseHas('job_listings', ['id' => $job->id, 'title' => 'Test Job']);
    }

    public function test_jobs_without_an_owner_cannot_be_edited_by_anyone(): void
    {
        $job = $this->makeJob(null);
        Sanctum::actingAs($this->makeEmployer());

        $this->putJson("/api/jobs/{$job->id}", ['title' => 'Nope'])->assertForbidden();
        $this->deleteJson("/api/jobs/{$job->id}")->assertForbidden();
    }

    public function test_deleting_a_job_removes_its_applications(): void
    {
        $employer = $this->makeEmployer();
        $job = $this->makeJob($employer);
        $application = $this->makeApplication($job);
        Sanctum::actingAs($employer);

        $this->deleteJson("/api/jobs/{$job->id}")->assertOk();

        $this->assertDatabaseMissing('job_listings', ['id' => $job->id]);
        $this->assertDatabaseMissing('applications', ['id' => $application->id]);
    }

    public function test_employers_cannot_delete_other_employers_jobs(): void
    {
        $job = $this->makeJob($this->makeEmployer());
        Sanctum::actingAs($this->makeEmployer());

        $this->deleteJson("/api/jobs/{$job->id}")->assertForbidden();

        $this->assertDatabaseHas('job_listings', ['id' => $job->id]);
    }

    public function test_closed_jobs_are_hidden_from_the_public_listing(): void
    {
        $employer = $this->makeEmployer();
        $this->makeJob($employer, ['title' => 'Open Role']);
        $this->makeJob($employer, ['title' => 'Closed Role', 'is_active' => false]);

        $titles = collect($this->getJson('/api/jobs')->assertOk()->json())->pluck('title');

        $this->assertTrue($titles->contains('Open Role'));
        $this->assertFalse($titles->contains('Closed Role'));
    }

    public function test_public_listing_does_not_leak_employer_details(): void
    {
        $employer = $this->makeEmployer([
            'email' => 'private.employer@example.test',
            'mobile_number' => '09171112222',
        ]);
        $this->makeJob($employer);

        $response = $this->getJson('/api/jobs')
            ->assertOk()
            ->assertJsonStructure(['*' => ['id', 'title', 'company_logo_url']]);

        $body = $response->getContent();
        $this->assertStringNotContainsString('private.employer@example.test', $body);
        $this->assertStringNotContainsString('09171112222', $body);
        $this->assertStringNotContainsString('employer_profile', $body);
    }
}