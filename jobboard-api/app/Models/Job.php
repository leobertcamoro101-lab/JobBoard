<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}