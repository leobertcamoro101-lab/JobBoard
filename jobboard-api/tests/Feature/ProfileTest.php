<?php

namespace Tests\Feature;

use App\Models\ApplicantProfile;
use App\Models\EmployerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function postProfile(array $data)
    {
        return $this->withHeader('Accept', 'application/json')->post('/api/profile', $data);
    }

    public function test_updating_a_profile_requires_a_login(): void
    {
        $this->postJson('/api/profile', [])->assertUnauthorized();
    }

    public function test_an_applicant_can_replace_their_resume_and_the_old_file_is_deleted(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('resumes/test.pdf', 'old resume');
        $applicant = $this->makeApplicant();
        Sanctum::actingAs($applicant);

        $this->postProfile([
            'first_name' => 'App',
            'last_name' => 'Licant',
            'mobile_number' => '09170000002',
            'resume' => UploadedFile::fake()->create('new-resume.pdf', 100, 'application/pdf'),
            'allow_view' => '0',
        ])->assertOk();

        $profile = ApplicantProfile::where('user_id', $applicant->id)->first();

        $this->assertNotSame('resumes/test.pdf', $profile->resume_path);
        $this->assertFalse((bool) $profile->allow_view);
        Storage::disk('public')->assertExists($profile->resume_path);
        Storage::disk('public')->assertMissing('resumes/test.pdf');
    }

    public function test_a_resume_with_the_wrong_file_type_is_rejected(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->makeApplicant());

        $this->postProfile([
            'first_name' => 'App',
            'last_name' => 'Licant',
            'mobile_number' => '09170000002',
            'resume' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ])->assertStatus(422)->assertJsonValidationErrors('resume');
    }

    public function test_an_employer_can_update_the_company_and_remove_the_logo(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('company-logos/old.png', 'logo');
        $employer = $this->makeEmployer();
        EmployerProfile::where('user_id', $employer->id)->update(['company_logo_path' => 'company-logos/old.png']);
        Sanctum::actingAs($employer);

        $this->postProfile([
            'first_name' => 'New',
            'last_name' => 'Name',
            'mobile_number' => '09170000003',
            'company_name' => 'Apex Technology Group',
            'company_website' => 'https://apex.example.test',
            'remove_logo' => '1',
        ])->assertOk();

        $profile = EmployerProfile::where('user_id', $employer->id)->first();

        $this->assertSame('Apex Technology Group', $profile->company_name);
        $this->assertNull($profile->company_logo_path);
        Storage::disk('public')->assertMissing('company-logos/old.png');
        $this->assertDatabaseHas('users', ['id' => $employer->id, 'name' => 'New Name']);
    }
}