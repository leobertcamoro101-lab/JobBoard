<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use App\Models\EmployerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();
        $isEmployer = $user->role === 'employer';

        $rules = [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'mobile_number' => ['required', 'string', 'max:30'],
        ];

        if ($isEmployer) {
            $rules += [
                'company_name' => ['required', 'string', 'max:255'],
                'company_website' => ['nullable', 'url', 'max:255'],
                'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:900'],
                'remove_logo' => ['sometimes'],
            ];
        } else {
            $rules += [
                'resume' => ['nullable', 'file', 'mimes:doc,docx,odt,pdf,rtf', 'max:900'],
                'allow_view' => ['sometimes'],
            ];
        }

        $data = $request->validate($rules);

        $user->update([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'mobile_number' => $data['mobile_number'],
            'name' => trim($data['first_name'] . ' ' . $data['last_name']),
        ]);

        if ($isEmployer) {
            $profile = $user->employerProfile ?? new EmployerProfile(['user_id' => $user->id]);
            $oldLogo = $profile->company_logo_path;

            $profile->company_name = $data['company_name'];
            $profile->company_website = $data['company_website'] ?? null;

            if ($request->hasFile('logo')) {
                $profile->company_logo_path = $request->file('logo')->store('company-logos', 'public');
            } elseif (filter_var($request->input('remove_logo'), FILTER_VALIDATE_BOOLEAN)) {
                $profile->company_logo_path = null;
            }

            $profile->save();

            if ($oldLogo && $oldLogo !== $profile->company_logo_path) {
                Storage::disk('public')->delete($oldLogo);
            }
        } else {
            $profile = $user->applicantProfile ?? new ApplicantProfile(['user_id' => $user->id]);
            $oldResume = $profile->resume_path;

            if ($request->hasFile('resume')) {
                $profile->resume_path = $request->file('resume')->store('resumes', 'public');
            }

            if ($request->has('allow_view')) {
                $profile->allow_view = filter_var($request->input('allow_view'), FILTER_VALIDATE_BOOLEAN);
            }

            $profile->save();

            if ($oldResume && $oldResume !== $profile->resume_path) {
                Storage::disk('public')->delete($oldResume);
            }
        }

        $user->load($isEmployer ? 'employerProfile' : 'applicantProfile');

        return response()->json($user);
    }
}