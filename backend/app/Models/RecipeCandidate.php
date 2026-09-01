<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A proposed composition for a dish, with a review state.
 *
 * Nothing here is a calorie figure. Ingredients are names and gram ranges;
 * USDA supplies the nutrition and deterministic code does the arithmetic.
 */
class RecipeCandidate extends Model
{
    /** Only these are trustworthy enough to serve to everyone unprompted. */
    public const AUTHORITATIVE = ['reviewed', 'curated_override'];

    protected $fillable = [
        'dish', 'locale', 'variant', 'preparation',
        'model_version', 'schema_version', 'recipe_version',
        'cache_key', 'state', 'ingredients', 'assumptions', 'serving_g',
        'hits', 'confirmations', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'ingredients' => 'array',
            'assumptions' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * The identity of a recipe proposal.
     *
     * Everything that could change the answer is in the key, including which
     * model and prompt produced it. Leaving those out is how a revised prompt
     * silently keeps serving compositions the old one wrote.
     */
    public static function keyFor(array $parts): string
    {
        return hash('sha256', implode('|', [
            mb_strtolower(trim($parts['dish'])),
            $parts['locale'],
            mb_strtolower(trim($parts['variant'] ?? '')),
            mb_strtolower(trim($parts['preparation'] ?? '')),
            $parts['model_version'],
            $parts['schema_version'],
            $parts['recipe_version'] ?? 1,
        ]));
    }

    public function isAuthoritative(): bool
    {
        return in_array($this->state, self::AUTHORITATIVE, true);
    }
}
