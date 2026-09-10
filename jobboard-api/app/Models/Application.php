<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id', 'name', 'email', 'phone',
        'linkedin', 'portfolio', 'cover_letter',
        'resume_url', 'status',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
}
