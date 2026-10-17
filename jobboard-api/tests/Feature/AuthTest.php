<?php

namespace Tests\Feature;

use App\Mail\ConfirmationCodeMail;
use App\Models\PendingRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function signupBody(array $overrides = []): array
    {
        return array_merge([
            'email' => 'new.applicant@example.test',
            'password' => 'StrongPass123!',
            'confirmPassword' => 'StrongPass123!',
            'firstName' => 'New',
            'lastName' => 'Applicant',
            'mobileNumber' => '09170000009',
        ], $overrides);
    }

    private function confirm(array $data)
    {
        return $this->withHeader('Accept', 'application/json')
            ->post('/api/applicant/register/confirm', array_merge([
                'email' => 'new.applicant@example.test',
                'resume' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
                'allow_view' => '1',
            ], $data));
    }

    // ---- login ----

    public function test_login_with_a_wrong_password_fails(): void
    {
        $user = $this->makeEmployer(['password' => 'CorrectPass123!']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'WrongPass123!'])
            ->assertStatus(422);
    }

    public function test_login_returns_a_token_and_the_profile(): void
    {
        $user = $this->makeEmployer(['password' => 'CorrectPass123!']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'CorrectPass123!'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'role']])
            ->assertJsonPath('user.employer_profile.company_name', 'Acme Corp');
    }

    // ---- signup ----

    public function test_signup_rejects_a_weak_password(): void
    {
        $this->postJson('/api/applicant/register', $this->signupBody([
            'password' => 'weak',
            'confirmPassword' => 'weak',
        ]))->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_signup_rejects_an_email_that_is_already_registered(): void
    {
        $existing = $this->makeApplicant();

        $this->postJson('/api/applicant/register', $this->signupBody(['email' => $existing->email]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_signup_requires_the_emailed_code_when_confirmation_is_on(): void
    {
        config(['jobboard.require_email_confirmation' => true]);
        Mail::fake();
        Storage::fake('public');

        $this->postJson('/api/applicant/register', $this->signupBody())
            ->assertOk()
            ->assertJson(['requires_code' => true]);

        Mail::assertSent(ConfirmationCodeMail::class, fn ($mail) => $mail->hasTo('new.applicant@example.test'));

        // wrong code: no account
        $this->confirm(['code' => '0000'])->assertStatus(422);
        $this->assertDatabaseMissing('users', ['email' => 'new.applicant@example.test']);

        // right code: account created and logged in
        $code = PendingRegistration::where('email', 'new.applicant@example.test')->value('code');
        $response = $this->confirm(['code' => $code])->assertOk()->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', ['email' => 'new.applicant@example.test', 'role' => 'applicant']);
        $path = $response->json('user.applicant_profile.resume_path');
        Storage::disk('public')->assertExists($path);
    }

    public function test_signup_can_skip_the_code_when_confirmation_is_off(): void
    {
        config(['jobboard.require_email_confirmation' => false]);
        Mail::fake();
        Storage::fake('public');

        $this->postJson('/api/applicant/register', $this->signupBody())
            ->assertOk()
            ->assertJson(['requires_code' => false]);

        Mail::assertNothingSent();

        $this->confirm([])->assertOk()->assertJsonStructure(['token', 'user']);

        $user = User::where('email', 'new.applicant@example.test')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
    }

    // ---- change password ----

    public function test_changing_a_password_requires_a_login(): void
    {
        $this->putJson('/api/profile/password', [])->assertUnauthorized();
    }

    public function test_the_current_password_must_be_correct(): void
    {
        $user = $this->makeApplicant(['password' => 'OldPass123!']);
        $token = $user->createToken('current')->plainTextToken;

        $this->withToken($token)->putJson('/api/profile/password', [
            'current_password' => 'NotMyPassword1!',
            'password' => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('OldPass123!', $user->fresh()->password));
    }

    public function test_the_new_password_must_differ_from_the_old_one(): void
    {
        $user = $this->makeApplicant(['password' => 'OldPass123!']);
        $token = $user->createToken('current')->plainTextToken;

        $this->withToken($token)->putJson('/api/profile/password', [
            'current_password' => 'OldPass123!',
            'password' => 'OldPass123!',
            'password_confirmation' => 'OldPass123!',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_a_password_change_signs_out_other_devices_but_not_this_one(): void
    {
        $user = $this->makeApplicant(['password' => 'OldPass123!']);
        $current = $user->createToken('current')->plainTextToken;
        $other = $user->createToken('other')->plainTextToken;

        $this->withToken($current)->putJson('/api/profile/password', [
            'current_password' => 'OldPass123!',
            'password' => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPass456!', $user->fresh()->password));
        $this->assertNotNull(PersonalAccessToken::findToken($current));
        $this->assertNull(PersonalAccessToken::findToken($other));
    }

    public function test_login_is_rate_limited(): void
    {
        $user = $this->makeApplicant(['password' => 'CorrectPass123!']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => $user->email, 'password' => 'WrongPass123!'])
                ->assertStatus(422);
        }

        // The sixth attempt is blocked, even with the right password
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'CorrectPass123!'])
            ->assertStatus(429);
    }
}