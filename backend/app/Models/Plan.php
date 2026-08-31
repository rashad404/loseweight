<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plan extends Model
{
    protected $fillable = [
        'user_id', 'sex', 'age', 'height_cm', 'start_weight_kg', 'goal_weight_kg',
        'activity_factor', 'rate_kg_per_week', 'units',
        'bmr', 'tdee', 'target_calories', 'protein_g', 'fiber_g',
        'estimated_weeks', 'started_on', 'target_date',
    ];

    protected function casts(): array
    {
        return [
            'height_cm' => 'float',
            'start_weight_kg' => 'float',
            'goal_weight_kg' => 'float',
            'activity_factor' => 'float',
            'rate_kg_per_week' => 'float',
            'started_on' => 'date',
            'target_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
