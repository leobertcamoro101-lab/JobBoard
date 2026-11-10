<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private const OLD = 'Old-Passw0rd!';
    private const NEW = 'New-Passw0rd!x';

    private function account(): User
    {
        return User::factory()->create(['role' => 'applicant', 'password' => Hash::make(self::OLD)]);
    }

    private function tokenFor(User $user): string
    {
        return Password::broker()->createToken($user);
    }

    private function reset(User $user, string $token, string $password = self::NEW, ?string $confirmation = null)
    {
        return $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => $password,
            'password_confirmation' => $confirmation ?? $password,
        ]);
    }

    // Asking for the link

    public function test_a_known_email_gets_a_reset_link(): void
    {
        Notification::fake();
        $user = $this->account();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_an_unknown_email_gets_the_same_answer_and_no_email(): void
    {
        Notification::fake();
        $user = $this->account();

        $known = $this->postJson('/api/forgot-password', ['email' => $user->email]);
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'nobody@example.test']);

        $this->assertSame($known->status(), $unknown->status());
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertCount(1);
    }

    public function test_the_email_links_to_the_react_app(): void
    {
        Notification::fake();
        config(['jobboard.frontend_url' => 'https://app.example.test/']);
        $user = $this->account();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;

            return str_starts_with($url, 'https://app.example.test/reset-password?token=')
                && str_contains($url, 'email=' . urlencode($user->email));
        });
    }

    public function test_an_email_is_required_and_must_look_like_one(): void
    {
        $this->postJson('/api/forgot-password', [])->assertStatus(422)->assertJsonValidationErrors(['email']);
        $this->postJson('/api/forgot-password', ['email' => 'nope'])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_asking_too_often_is_throttled(): void
    {
        Notification::fake();
        $user = $this->account();

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        }

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertStatus(429);
    }

    // Using the link

    public function test_a_valid_token_resets_the_password(): void
    {
        $user = $this->account();

        $this->reset($user, $this->tokenFor($user))->assertOk();

        $this->assertTrue(Hash::check(self::NEW, $user->fresh()->password));
        $this->assertFalse(Hash::check(self::OLD, $user->fresh()->password));
    }

    public function test_the_new_password_works_at_login(): void
    {
        $user = $this->account();
        $this->reset($user, $this->tokenFor($user))->assertOk();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => self::NEW])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_a_reset_signs_out_every_device(): void
    {
        $user = $this->account();
        $user->createToken('phone');
        $user->createToken('laptop');
        $this->assertDatabaseCount('personal_access_tokens', 2);

        $this->reset($user, $this->tokenFor($user))->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_a_wrong_token_is_rejected(): void
    {
        $user = $this->account();

        $this->reset($user, 'not-a-real-token')->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->assertTrue(Hash::check(self::OLD, $user->fresh()->password));
    }

    public function test_a_token_cannot_be_used_twice(): void
    {
        $user = $this->account();
        $token = $this->tokenFor($user);

        $this->reset($user, $token)->assertOk();
        $this->reset($user, $token, 'Another-Passw0rd!')->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->assertTrue(Hash::check(self::NEW, $user->fresh()->password));
    }

    public function test_a_token_expires_after_an_hour(): void
    {
        $user = $this->account();
        $token = $this->tokenFor($user);

        $this->travel(61)->minutes();

        $this->reset($user, $token)->assertStatus(422)->assertJsonValidationErrors(['email']);
        $this->assertTrue(Hash::check(self::OLD, $user->fresh()->password));
    }

    public function test_a_token_only_works_for_its_own_email(): void
    {
        $owner = $this->account();
        $other = $this->account();

        $this->reset($other, $this->tokenFor($owner))->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->assertTrue(Hash::check(self::OLD, $other->fresh()->password));
    }

    public function test_a_weak_password_is_rejected_and_the_token_is_not_used_up(): void
    {
        $user = $this->account();
        $token = $this->tokenFor($user);

        $this->reset($user, $token, 'weak')->assertStatus(422)->assertJsonValidationErrors(['password']);

        $this->reset($user, $token)->assertOk();
    }

    public function test_the_confirmation_must_match(): void
    {
        $user = $this->account();

        $this->reset($user, $this->tokenFor($user), self::NEW, 'Different-Passw0rd!')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password_confirmation']);
    }

    public function test_guessing_tokens_is_throttled(): void
    {
        $user = $this->account();

        for ($i = 0; $i < 5; $i++) {
            $this->reset($user, 'guess-' . $i)->assertStatus(422);
        }

        $this->reset($user, 'guess-6')->assertStatus(429);
    }
}
