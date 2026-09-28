<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id', 'user_id', 'name', 'email', 'phone',
        'linkedin', 'portfolio', 'cover_letter', 'status',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
