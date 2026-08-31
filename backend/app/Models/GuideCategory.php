<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuideCategory extends Model
{
    protected $fillable = ['language', 'slug', 'name', 'description', 'sort_order'];

    public function guides(): HasMany
    {
        return $this->hasMany(Guide::class);
    }

    public function scopeInLanguage(Builder $query, string $language): Builder
    {
        return $query->where('language', $language);
    }
}
