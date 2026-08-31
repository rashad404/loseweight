<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeightEntry extends Model
{
    protected $fillable = ['user_id', 'recorded_on', 'weight_kg', 'waist_cm', 'note'];

    protected function casts(): array
    {
        return [
            'recorded_on' => 'date',
            'weight_kg' => 'float',
            'waist_cm' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
