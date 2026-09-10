<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Job extends Model
{
    use HasFactory;

    protected $table = 'job_listings'; // ← add this

    protected $fillable = [
        'title', 'company', 'company_logo', 'location',
        'type', 'salary_min', 'salary_max', 'currency',
        'description', 'requirements', 'apply_email',
        'is_active', 'category',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
