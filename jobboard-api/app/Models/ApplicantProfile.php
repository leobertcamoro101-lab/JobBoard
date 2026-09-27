<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicantProfile extends Model
{
    protected $fillable = ['user_id', 'resume_path', 'allow_view'];

    protected function casts(): array
    {
        return ['allow_view' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getResumeUrlAttribute(): ?string
    {
        return $this->resume_path ? asset('storage/' . $this->resume_path) : null;
    }
}