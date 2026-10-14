<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Job extends Model
{
    use HasFactory;

    protected $table = 'job_listings';

    protected $fillable = [
        'title', 'company', 'company_logo', 'location',
        'type', 'salary_min', 'salary_max', 'currency',
        'description', 'requirements', 'apply_email',
        'is_active', 'category', 'employer_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['company_logo_url'];

    // Loaded to compute company_logo_url; never sent to the client as-is
    protected $hidden = ['employerProfile'];

    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function employerProfile(): HasOne
    {
        return $this->hasOne(EmployerProfile::class, 'user_id', 'employer_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function getCompanyLogoUrlAttribute(): ?string
    {
        return $this->employerProfile?->company_logo_url;
    }
}