<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUsage extends Model
{
    protected $table = 'ai_usage';

    protected $fillable = [
        'day', 'user_key', 'feature', 'model',
        'input_tokens', 'output_tokens', 'cost_usd', 'cached',
    ];

    protected function casts(): array
    {
        return ['day' => 'date', 'cached' => 'boolean', 'cost_usd' => 'float'];
    }
}
