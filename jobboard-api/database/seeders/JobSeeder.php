<?php

namespace Database\Seeders;

use App\Models\Job;
use Illuminate\Database\Seeder;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $jobs = [
            [
                'title' => 'Senior React Developer',
                'company' => 'TechCorp Manila',
                'location' => 'Manila, Philippines',
                'type' => 'full-time',
                'salary_min' => '80000',
                'salary_max' => '120000',
                'currency' => 'PHP',
                'category' => 'Engineering',
                'description' => 'We are looking for a Senior React Developer to join our growing team. You will be responsible for building and maintaining high-quality web applications.',
                'requirements' => '5+ years React experience\nTypeScript proficiency\nNext.js experience preferred\nStrong communication skills',
                'apply_email' => 'jobs@techcorp.com',
            ],
            [
                'title' => 'Full Stack Laravel Engineer',
                'company' => 'Sprobe Inc.',
                'location' => 'Cebu City, Philippines',
                'type' => 'full-time',
                'salary_min' => '60000',
                'salary_max' => '90000',
                'currency' => 'PHP',
                'category' => 'Engineering',
                'description' => 'Join our team as a Full Stack Engineer working with React and Laravel. Build scalable web applications for clients across Southeast Asia.',
                'requirements' => '3+ years Laravel experience\nReact JS knowledge\nPostgreSQL experience\nAPI development experience',
                'apply_email' => 'hr@sprobe.com',
            ],
            [
                'title' => 'Frontend Developer (Remote)',
                'company' => 'StartupXYZ',
                'location' => 'Remote',
                'type' => 'remote',
                'salary_min' => '3000',
                'salary_max' => '5000',
                'currency' => 'USD',
                'category' => 'Engineering',
                'description' => 'We are a fast-growing startup looking for a talented Frontend Developer to help build our next-generation SaaS platform.',
                'requirements' => 'React + TypeScript\nTailwind CSS\nREST API integration\nCI/CD experience a plus',
                'apply_email' => 'careers@startupxyz.com',
            ],
            [
                'title' => 'UI/UX Designer',
                'company' => 'Creative Studio',
                'location' => 'Davao City, Philippines',
                'type' => 'full-time',
                'salary_min' => '40000',
                'salary_max' => '65000',
                'currency' => 'PHP',
                'category' => 'Design',
                'description' => 'Looking for a creative UI/UX Designer who can turn complex problems into simple, beautiful designs.',
                'requirements' => 'Figma proficiency\nPortfolio required\nWeb design experience\nCollaboration skills',
                'apply_email' => 'design@creativestudio.com',
            ],
            [
                'title' => 'DevOps Engineer',
                'company' => 'CloudBase',
                'location' => 'Remote',
                'type' => 'contract',
                'salary_min' => '4000',
                'salary_max' => '7000',
                'currency' => 'USD',
                'category' => 'DevOps',
                'description' => 'Contract DevOps Engineer needed to help us scale our infrastructure. Docker, Kubernetes, and CI/CD expertise required.',
                'requirements' => 'Docker + Kubernetes\nGitHub Actions\nAWS or GCP\nLinux administration',
                'apply_email' => 'ops@cloudbase.io',
            ],
            [
                'title' => 'Node.js Backend Developer',
                'company' => 'FinTech Solutions',
                'location' => 'Manila, Philippines',
                'type' => 'full-time',
                'salary_min' => '70000',
                'salary_max' => '100000',
                'currency' => 'PHP',
                'category' => 'Engineering',
                'description' => 'Build robust backend APIs for our financial services platform. Experience with real-time systems is a plus.',
                'requirements' => 'Node.js + Express\nPostgreSQL or MongoDB\nREST API design\nSecurity best practices',
                'apply_email' => 'tech@fintechsolutions.ph',
            ],
        ];

        foreach ($jobs as $job) {
            Job::create($job);
        }
    }
}
