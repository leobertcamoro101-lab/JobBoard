<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplyTest extends TestCase
{
    use RefreshDatabase;

    private function guestBody(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Guest Person',
            'email' => 'guest@example.test',
            'cover_letter' => $this->coverLetter(),
        ], $overrides);
    }

    public function test_a_guest_can_apply_without_an_account(): void
    {
        $job = $this->makeJob($this->makeEmployer());

        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody())->assertCreated();

        $this->assertDatabaseHas('applications', [
            'job_id' => $job->id,
            'email' => 'guest@example.test',
            'user_id' => null,
            'status' => 'pending',
        ]);
    }

    public function test_the_status_in_the_request_is_ignored(): void
    {
        $job = $this->makeJob($this->makeEmployer());

        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody(['status' => 'accepted']))->assertCreated();

        $this->assertDatabaseHas('applications', ['email' => 'guest@example.test', 'status' => 'pending']);
    }

    public function test_a_logged_in_applicant_applies_as_themselves(): void
    {
        $applicant = $this->makeApplicant();
        $job = $this->makeJob($this->makeEmployer());
        Sanctum::actingAs($applicant);

        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody([
            'name' => 'Someone Else',
            'email' => 'someone@else.test',
        ]))->assertCreated();

        $this->assertDatabaseHas('applications', [
            'job_id' => $job->id,
            'user_id' => $applicant->id,
            'name' => $applicant->name,
            'email' => $applicant->email,
        ]);
        $this->assertDatabaseMissing('applications', ['email' => 'someone@else.test']);
    }

    public function test_the_same_person_cannot_apply_twice(): void
    {
        $job = $this->makeJob($this->makeEmployer());

        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody())->assertCreated();
        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody())->assertStatus(422);

        $this->assertDatabaseCount('applications', 1);
    }

    public function test_closed_jobs_do_not_accept_applications(): void
    {
        $job = $this->makeJob($this->makeEmployer(), ['is_active' => false]);

        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody())->assertStatus(422);

        $this->assertDatabaseCount('applications', 0);
    }

    public function test_a_short_cover_letter_is_rejected(): void
    {
        $job = $this->makeJob($this->makeEmployer());

        $this->postJson("/api/jobs/{$job->id}/apply", $this->guestBody(['cover_letter' => 'Too short']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('cover_letter');
    }
}