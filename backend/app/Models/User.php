<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'wallet_id', 'name', 'email', 'phone', 'password', 'is_admin', 'locale',
        'wallet_access_token', 'wallet_refresh_token', 'wallet_token_expires_at',
    ];

    protected $hidden = [
        'password', 'remember_token',
        'wallet_access_token', 'wallet_refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'wallet_token_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }

    public function currentPlan(): ?Plan
    {
        return $this->plans()->latest()->first();
    }

    public function weightEntries(): HasMany
    {
        return $this->hasMany(WeightEntry::class);
    }

    public function progressState(): HasOne
    {
        return $this->hasOne(ProgressState::class);
    }
}
