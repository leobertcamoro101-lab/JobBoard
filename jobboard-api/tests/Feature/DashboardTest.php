<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboards_require_a_login(): void
    {
        $this->getJson('/api/applicant/applications')->assertUnauthorized();
        $this->getJson('/api/employer/jobs')->assertUnauthorized();
    }

    public function test_an_applicant_sees_only_their_own_applications(): void
    {
        $job = $this->makeJob($this->makeEmployer());
        $alice = $this->makeApplicant();
        $bob = $this->makeApplicant();
        $this->makeApplication($job, $alice);
        $this->makeApplication($job, $bob);
        Sanctum::actingAs($alice);

        $this->getJson('/api/applicant/applications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.job_title', 'Test Job');
    }

    public function test_an_employer_sees_only_their_own_jobs(): void
    {
        $mine = $this->makeEmployer();
        $theirs = $this->makeEmployer();
        $this->makeJob($mine, ['title' => 'Mine A']);
        $this->makeJob($mine, ['title' => 'Mine B']);
        $this->makeJob($theirs, ['title' => 'Theirs']);
        Sanctum::actingAs($mine);

        $titles = collect($this->getJson('/api/employer/jobs')->assertOk()->json())->pluck('title');

        $this->assertCount(2, $titles);
        $this->assertFalse($titles->contains('Theirs'));
    }
}