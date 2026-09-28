<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    protected $fillable = ['email', 'code', 'payload', 'expires_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}