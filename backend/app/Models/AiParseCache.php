<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiParseCache extends Model
{
    protected $table = 'ai_parse_cache';

    protected $fillable = ['input_hash', 'feature', 'result', 'model', 'hits'];

    protected function casts(): array
    {
        return ['result' => 'array'];
    }
}
