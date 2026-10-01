<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use App\Models\EmployerProfile;
use App\Models\PendingRegistration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
        private function generateCode(string $email, array $payload): string
    {
        $code = (string) random_int(1000, 9999);

        PendingRegistration::updateOrCreate(
            ['email' => $email],
            ['code' => $code, 'payload' => $payload, 'expires_at' => now()->addMinutes(15)]
        );

        Log::info("Confirmation code for {$email}: {$code}");

        return $code;
    }

    private function verifyCode(string $email, string $code): PendingRegistration
    {
        $pending = PendingRegistration::where('email', $email)->first();

        if (! $pending || $pending->code !== $code) {
            throw ValidationException::withMessages(['code' => 'Invalid confirmation code']);
        }

        if ($pending->isExpired()) {
            throw ValidationException::withMessages(['code' => 'Confirmation code has expired']);
        }

        return $pending;
    }

    private function passwordRules(): array
    {
        return ['required', 'string', 'min:10', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[^A-Za-z0-9]/'];
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

				return response()->json(['message' => 'Confirmation code sent', 'email' => $data['email']]);
		}

public function confirmApplicantRegistration(Request $request)
{
    $data = $request->validate([
        'email' => ['required', 'email'],
        'code' => ['required', 'string'],
        'resume' => ['required', 'file', 'mimes:doc,docx,odt,pdf,rtf', 'max:900'],
        'allow_view' => ['required'],
    ]);

    $pending = $this->verifyCode($data['email'], $data['code']);
    $payload = $pending->payload;

    $user = User::create([
        'name' => trim($payload['first_name'] . ' ' . $payload['last_name']),
        'email' => $data['email'],
        'password' => $payload['password'],
        'role' => 'applicant',
        'first_name' => $payload['first_name'],
        'last_name' => $payload['last_name'],
        'mobile_number' => $payload['mobile_number'],
        'email_verified_at' => now(),
    ]);

    $resumePath = $request->file('resume')->store('resumes', 'public');

    ApplicantProfile::create([
        'user_id' => $user->id,
        'resume_path' => $resumePath,
        'allow_view' => filter_var($data['allow_view'], FILTER_VALIDATE_BOOLEAN),
    ]);

    $pending->delete();

    $token = $user->createToken('auth')->plainTextToken;

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

				return response()->json(['message' => 'Confirmation code sent', 'email' => $data['email']]);
		}

		public function confirmEmployerRegistration(Request $request)
		{
				$data = $request->validate([
						'email' => ['required', 'email'],
						'code' => ['required', 'string'],
						'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:900'],
				]);

				$pending = $this->verifyCode($data['email'], $data['code']);
				$payload = $pending->payload;

				$user = User::create([
						'name' => trim($payload['first_name'] . ' ' . $payload['last_name']),
						'email' => $data['email'],
						'password' => $payload['password'],
						'role' => 'employer',
						'first_name' => $payload['first_name'],
						'last_name' => $payload['last_name'],
						'mobile_number' => $payload['mobile_number'],
						'email_verified_at' => now(),
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

				$token = $user->createToken('auth')->plainTextToken;

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

        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials']);
        }

        $user = Auth::user();
        $user->load($user->role === 'employer' ? 'employerProfile' : 'applicantProfile');

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    // public function login(Request $request)
    // {
    //     $request->validate([
    //         'email' => ['required', 'email'],
    //         'password' => ['required'],
    //     ]);

    //     $user = \App\Models\User::where('email', $request->email)->first();

    //     \Log::info('LOGIN DEBUG', [
    //         'email_received' => $request->email,
    //         'user_found' => (bool) $user,
    //         'user_id' => $user->id ?? null,
    //         'hash_check' => $user ? \Hash::check($request->password, $user->password) : null,
    //         'auth_attempt' => \Auth::attempt($request->only('email', 'password'), $request->boolean('remember')),
    //     ]);

    //     if (! \Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
    //         throw \Illuminate\Validation\ValidationException::withMessages(['email' => 'Invalid credentials']);
    //     }

    //     $user = \Auth::user();
    //     $user->load($user->role === 'employer' ? 'employerProfile' : 'applicantProfile');

    //     $token = $user->createToken('auth')->plainTextToken;

    //     return response()->json(['user' => $user, 'token' => $token]);
    // }

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