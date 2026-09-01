<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamificationEvent extends Model
{
    protected $fillable = ['user_id', 'name', 'properties', 'occurred_at'];

    protected function casts(): array
    {
        return ['properties' => 'array', 'occurred_at' => 'datetime'];
    }
}
