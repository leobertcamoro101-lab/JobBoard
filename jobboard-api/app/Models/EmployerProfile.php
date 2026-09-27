<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerProfile extends Model
{
    protected $fillable = ['user_id', 'company_name', 'company_website', 'company_logo_path'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getCompanyLogoUrlAttribute(): ?string
    {
        return $this->company_logo_path ? asset('storage/' . $this->company_logo_path) : null;
    }
}