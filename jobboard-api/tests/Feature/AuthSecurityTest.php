<?php

namespace Tests\Feature;

use App\Models\PendingRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Str0ng!Passw0rd';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Storage::fake('public');
        config(['jobboard.require_email_confirmation' => true]);

        // These tests make many calls on purpose; the throttles are not what they check
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    private function startApplicantSignup(string $email = 'new@example.test'): PendingRegistration
    {
        $this->postJson('/api/applicant/register', [
            'email' => $email,
            'password' => self::PASSWORD,
            'confirmPassword' => self::PASSWORD,
            'firstName' => 'Ana',
            'lastName' => 'Cruz',
            'mobileNumber' => '+639171234567',
        ])->assertOk();

        return PendingRegistration::where('email', $email)->firstOrFail();
    }

    private function confirmApplicant(string $email, string $code)
    {
        return $this->post('/api/applicant/register/confirm', [
            'email' => $email,
            'code' => $code,
            'allow_view' => '1',
            'resume' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json']);
    }

    private function wrongCodeFor(PendingRegistration $pending): string
    {
        return $pending->code === '0000' ? '1111' : '0000';
    }

    private function expiryOf(string $plainTextToken)
    {
        return PersonalAccessToken::findToken($plainTextToken)->expires_at;
    }

    // Token lifetime

    public function test_login_token_lasts_about_a_day_by_default(): void
    {
        $user = User::factory()->create(['role' => 'applicant', 'password' => Hash::make(self::PASSWORD)]);

        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => self::PASSWORD])->assertOk();

        $this->assertTrue($this->expiryOf($response->json('token'))->between(now()->addHours(23), now()->addHours(25)));
    }

    public function test_keep_me_logged_in_gives_a_30_day_token(): void
    {
        $user = User::factory()->create(['role' => 'applicant', 'password' => Hash::make(self::PASSWORD)]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => self::PASSWORD,
            'remember' => true,
        ])->assertOk();

        $this->assertTrue($this->expiryOf($response->json('token'))->between(now()->addDays(29), now()->addDays(31)));
    }

    public function test_an_expired_token_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'applicant']);
        $token = $user->createToken('auth', ['*'], now()->subMinute())->plainTextToken;

        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_a_valid_token_still_works(): void
    {
        $user = User::factory()->create(['role' => 'applicant']);
        $token = $user->createToken('auth', ['*'], now()->addHour())->plainTextToken;

        $this->withToken($token)->getJson('/api/me')->assertOk();
    }

    public function test_signup_token_lasts_about_a_day(): void
    {
        $pending = $this->startApplicantSignup();

        $response = $this->confirmApplicant($pending->email, $pending->code)->assertOk();

        $this->assertTrue($this->expiryOf($response->json('token'))->between(now()->addHours(23), now()->addHours(25)));
    }

    // Confirmation code attempts

    public function test_wrong_codes_are_counted(): void
    {
        $pending = $this->startApplicantSignup();

        for ($i = 0; $i < 4; $i++) {
            $this->confirmApplicant($pending->email, $this->wrongCodeFor($pending))
                ->assertStatus(422)
                ->assertJsonValidationErrors(['code']);
        }

        $this->assertSame(4, $pending->fresh()->attempts);
    }

    public function test_the_right_code_still_works_after_a_few_wrong_ones(): void
    {
        $pending = $this->startApplicantSignup();

        for ($i = 0; $i < 4; $i++) {
            $this->confirmApplicant($pending->email, $this->wrongCodeFor($pending))->assertStatus(422);
        }

        $this->confirmApplicant($pending->email, $pending->code)->assertOk();
        $this->assertDatabaseHas('users', ['email' => $pending->email]);
    }

    public function test_the_fifth_wrong_code_discards_the_signup_even_for_the_right_code_afterwards(): void
    {
        $pending = $this->startApplicantSignup();
        $wrong = $this->wrongCodeFor($pending);

        for ($i = 0; $i < 4; $i++) {
            $this->confirmApplicant($pending->email, $wrong)->assertStatus(422);
        }

        $this->confirmApplicant($pending->email, $wrong)
            ->assertStatus(422)
            ->assertJsonPath('errors.code.0', 'Too many incorrect codes. Please start again.');

        $this->assertDatabaseMissing('pending_registrations', ['email' => $pending->email]);

        $this->confirmApplicant($pending->email, $pending->code)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
        $this->assertDatabaseMissing('users', ['email' => $pending->email]);
    }

    public function test_asking_for_a_new_code_resets_the_attempt_counter(): void
    {
        $pending = $this->startApplicantSignup();

        for ($i = 0; $i < 3; $i++) {
            $this->confirmApplicant($pending->email, $this->wrongCodeFor($pending))->assertStatus(422);
        }
        $this->assertSame(3, $pending->fresh()->attempts);

        $this->postJson('/api/register/resend-code', ['email' => $pending->email])->assertOk();

        $this->assertSame(0, $pending->fresh()->attempts);
    }
}
