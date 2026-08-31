<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Guide extends Model
{
    protected $fillable = [
        'language', 'guide_category_id', 'slug', 'title', 'excerpt', 'body', 'hero_image',
        'author_name', 'author_credentials', 'reviewer_name', 'reviewer_credentials',
        'review_jurisdiction', 'us_licensed', 'independent_review',
        'reviewed_at', 'last_substantive_update', 'sources',
        'meta_title', 'meta_description', 'reading_minutes', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'sources' => 'array',
            'reviewed_at' => 'date',
            'last_substantive_update' => 'date',
            'us_licensed' => 'boolean',
            'independent_review' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(GuideCategory::class, 'guide_category_id');
    }

    /**
     * Guides are authored per language and never cross-shown: an `az` guide is
     * invisible to an `en` reader rather than falling back.
     */
    public function scopeInLanguage(Builder $query, string $language): Builder
    {
        return $query->where('language', $language);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public static function estimateReadingMinutes(string $body): int
    {
        $words = str_word_count(strip_tags($body));

        return max(1, (int) ceil($words / 220));
    }
}
