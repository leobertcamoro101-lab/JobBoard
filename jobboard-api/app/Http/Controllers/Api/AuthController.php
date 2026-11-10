<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ConfirmationCodeMail;
use App\Models\ApplicantProfile;
use App\Models\EmployerProfile;
use App\Models\PendingRegistration;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Wrong confirmation codes allowed before the pending signup is discarded. */
    private const MAX_CODE_ATTEMPTS = 5;

    private function issueToken(User $user, bool $remember = false): string
    {
        // Per-token expiry. Keep 'expiration' => null in config/sanctum.php so this applies.
        $expires = $remember ? now()->addDays(30) : now()->addDay();

        return $user->createToken('auth', ['*'], $expires)->plainTextToken;
    }

    private function requiresConfirmation(): bool
    {
        return (bool) config('jobboard.require_email_confirmation', true);
    }

    private function generateCode(string $email, array $payload): string
    {
        $code = (string) random_int(1000, 9999);

        PendingRegistration::updateOrCreate(
            ['email' => $email],
            ['code' => $code, 'payload' => $payload, 'expires_at' => now()->addMinutes(15), 'attempts' => 0]
        );

        // Confirmation switched off: keep the pending row, send nothing
        if (! $this->requiresConfirmation()) {
            return $code;
        }

        try {
            Mail::to($email)->send(new ConfirmationCodeMail($code));
        } catch (\Throwable $e) {
            // Log the failure, never the code itself
            Log::error('Confirmation email failed', ['email' => $email, 'error' => $e->getMessage()]);

            throw ValidationException::withMessages([
                'email' => 'We couldn\'t send the confirmation email. Please try again in a moment.',
            ]);
        }

        return $code;
    }

    private function verifyCode(string $email, ?string $code): PendingRegistration
    {
        $pending = PendingRegistration::where('email', $email)->first();

        if (! $pending) {
            throw ValidationException::withMessages([
                'email' => 'Your signup expired. Please start again.',
            ]);
        }

        if ($this->requiresConfirmation() && ! hash_equals($pending->code, (string) $code)) {
            $pending->increment('attempts');

            // Too many wrong guesses: throw the signup away so the code can't be brute-forced
            if ($pending->attempts >= self::MAX_CODE_ATTEMPTS) {
                $pending->delete();

                throw ValidationException::withMessages([
                    'code' => 'Too many incorrect codes. Please start again.',
                ]);
            }

            throw ValidationException::withMessages(['code' => 'Invalid confirmation code']);
        }

        if ($pending->isExpired()) {
            throw ValidationException::withMessages(['code' => 'Your signup expired. Please start again.']);
        }

        return $pending;
    }

    private function passwordRules(): array
    {
        return ['required', 'string', 'min:10', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[^A-Za-z0-9]/'];
    }

    private function codeRule(): array
    {
        return [$this->requiresConfirmation() ? 'required' : 'nullable', 'string'];
    }

    public function registerApplicant(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'password' => $this->passwordRules(),
            'confirmPassword' => ['required', 'same:password'],
            'firstName' => ['required', 'string'],
            'lastName' => ['required', 'string'],
            'mobileNumber' => ['required', 'string'],
        ]);

        $this->generateCode($data['email'], [
            'password' => Hash::make($data['password']),
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'],
            'mobile_number' => $data['mobileNumber'],
        ]);

        return response()->json([
            'message' => $this->requiresConfirmation() ? 'Confirmation code sent' : 'Continue to the next step',
            'email' => $data['email'],
            'requires_code' => $this->requiresConfirmation(),
        ]);
    }

    public function confirmApplicantRegistration(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'code' => $this->codeRule(),
            'resume' => ['required', 'file', 'mimes:doc,docx,odt,pdf,rtf', 'max:900'],
            'allow_view' => ['required'],
        ]);

        $pending = $this->verifyCode($data['email'], $data['code'] ?? null);
        $payload = $pending->payload;

        $user = User::create([
            'name' => trim($payload['first_name'] . ' ' . $payload['last_name']),
            'email' => $data['email'],
            'password' => $payload['password'],
            'role' => 'applicant',
            'first_name' => $payload['first_name'],
            'last_name' => $payload['last_name'],
            'mobile_number' => $payload['mobile_number'],
            'email_verified_at' => $this->requiresConfirmation() ? now() : null,
        ]);

        $resumePath = $request->file('resume')->store('resumes', 'public');

        ApplicantProfile::create([
            'user_id' => $user->id,
            'resume_path' => $resumePath,
            'allow_view' => filter_var($data['allow_view'], FILTER_VALIDATE_BOOLEAN),
        ]);

        $pending->delete();

        $token = $this->issueToken($user);

        return response()->json([
            'user' => $user->load('applicantProfile'),
            'token' => $token,
        ]);
    }

    public function registerEmployer(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'password' => $this->passwordRules(),
            'confirmPassword' => ['required', 'same:password'],
            'firstName' => ['required', 'string'],
            'lastName' => ['required', 'string'],
            'mobileNumber' => ['required', 'string'],
            'companyName' => ['required', 'string'],
            'companyWebsite' => ['nullable', 'url'],
        ]);

        $this->generateCode($data['email'], [
            'password' => Hash::make($data['password']),
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'],
            'mobile_number' => $data['mobileNumber'],
            'company_name' => $data['companyName'],
            'company_website' => $data['companyWebsite'] ?? null,
        ]);

        return response()->json([
            'message' => $this->requiresConfirmation() ? 'Confirmation code sent' : 'Continue to the next step',
            'email' => $data['email'],
            'requires_code' => $this->requiresConfirmation(),
        ]);
    }

    public function confirmEmployerRegistration(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'code' => $this->codeRule(),
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:900'],
        ]);

        $pending = $this->verifyCode($data['email'], $data['code'] ?? null);
        $payload = $pending->payload;

        $user = User::create([
            'name' => trim($payload['first_name'] . ' ' . $payload['last_name']),
            'email' => $data['email'],
            'password' => $payload['password'],
            'role' => 'employer',
            'first_name' => $payload['first_name'],
            'last_name' => $payload['last_name'],
            'mobile_number' => $payload['mobile_number'],
            'email_verified_at' => $this->requiresConfirmation() ? now() : null,
        ]);

        $logoPath = $request->hasFile('logo')
            ? $request->file('logo')->store('company-logos', 'public')
            : null;

        EmployerProfile::create([
            'user_id' => $user->id,
            'company_name' => $payload['company_name'],
            'company_website' => $payload['company_website'],
            'company_logo_path' => $logoPath,
        ]);

        $pending->delete();

        $token = $this->issueToken($user);

        return response()->json([
            'user' => $user->load('employerProfile'),
            'token' => $token,
        ]);
    }

    public function resendCode(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        $existing = PendingRegistration::where('email', $data['email'])->first();
        if (! $existing) {
            throw ValidationException::withMessages(['email' => 'No pending registration found for this email']);
        }

        $this->generateCode($data['email'], $existing->payload);

        return response()->json(['message' => 'Confirmation code resent']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials']);
        }

        $user = Auth::user();
        $user->load($user->role === 'employer' ? 'employerProfile' : 'applicantProfile');

        $token = $this->issueToken($user, $request->boolean('remember'));

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        try {
            Password::sendResetLink(['email' => $data['email']]);
        } catch (\Throwable $e) {
            // Log the failure (never the token or the address), but answer the same way
            Log::error('Password reset email failed', ['error' => $e->getMessage()]);
        }

        // Same answer whether or not the account exists, so this can't be used to find emails
        return response()->json([
            'message' => 'If that email has an account, we\'ve sent a link to reset the password.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => $this->passwordRules(),
            'password_confirmation' => ['required', 'same:password'],
        ]);

        $status = Password::reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $data['password_confirmation'],
                'token' => $data['token'],
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                // A reset may be someone recovering a stolen account: sign out every device
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'This reset link is invalid or has expired. Please request a new one.',
            ]);
        }

        return response()->json(['message' => 'Your password has been reset. You can log in now.']);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => array_merge($this->passwordRules(), ['different:current_password']),
            'password_confirmation' => ['required', 'same:password'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Your current password is incorrect.',
            ]);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        // Sign out every other device; keep the one making this request
        $user->tokens()
            ->where('id', '!=', $request->user()->currentAccessToken()->id)
            ->delete();

        return response()->json(['message' => 'Password updated']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load($user->role === 'employer' ? 'employerProfile' : 'applicantProfile');

        return response()->json($user);
    }
}