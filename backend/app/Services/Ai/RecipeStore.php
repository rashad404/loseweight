<?php

namespace App\Services\Ai;

use App\Models\RecipeCandidate;

/**
 * Keeps proposed dish compositions, and decides which may be trusted.
 *
 * A model names the contents of plov far better than a hand-written table can
 * enumerate a cuisine, but it is weakest at the gram weights the calories are
 * computed from, and "plov" is not one recipe: rice, meat, fat, dried fruit and
 * serving size all vary. So the first proposal for a dish is never allowed to
 * become permanent nutrition data for everyone.
 *
 * Three states matter here:
 *  - reviewed / curated_override: authoritative, served to anyone, and they
 *    replace whatever the model proposed this time.
 *  - user_confirmed: someone corrected or accepted it for themselves.
 *  - generated: a candidate. Usable, but the caller must show its uncertainty
 *    and ask, rather than presenting it as a known figure.
 */
class RecipeStore
{
    /**
     * Persist this parse's proposals and return them annotated with the state
     * the caller should present.
     *
     * @param  array  $dishes  sanitised proposals from the model
     * @return array the dishes to use, each with `state` and `recipeId`
     */
    public function reconcile(array $dishes, string $locale, string $model): array
    {
        return collect($dishes)->map(function (array $dish) use ($locale, $model) {
            // An approved recipe wins over anything proposed this time. This is
            // how a recurring model error gets corrected once and stays fixed.
            $approved = RecipeCandidate::query()
                ->where('dish', mb_strtolower($dish['dish']))
                ->where('locale', $locale)
                ->whereIn('state', RecipeCandidate::AUTHORITATIVE)
                // A manual override outranks a review. Written as CASE rather
                // than MySQL's FIELD() so the test database behaves the same.
                ->orderByRaw("CASE state WHEN 'curated_override' THEN 0 ELSE 1 END")
                ->first();

            if ($approved) {
                $approved->increment('hits');

                return $this->present($approved, $dish['dish']);
            }

            $key = RecipeCandidate::keyFor([
                'dish' => $dish['dish'],
                'locale' => $locale,
                'variant' => $dish['variant'],
                'preparation' => $dish['preparation'],
                'model_version' => $model,
                'schema_version' => RoutineParser::SCHEMA_VERSION,
            ]);

            $row = RecipeCandidate::firstOrNew(['cache_key' => $key]);

            if (! $row->exists) {
                $row->fill([
                    'dish' => mb_strtolower($dish['dish']),
                    'locale' => $locale,
                    'variant' => $dish['variant'],
                    'preparation' => $dish['preparation'],
                    'model_version' => $model,
                    'schema_version' => RoutineParser::SCHEMA_VERSION,
                    'recipe_version' => 1,
                    'state' => 'generated',
                    'ingredients' => $dish['ingredients'],
                    'assumptions' => $dish['assumptions'],
                    'serving_g' => $dish['servingG'],
                ]);
            }

            $row->hits++;
            $row->save();

            return $this->present($row, $dish['dish']);
        })->all();
    }

    /**
     * Record that a person accepted or corrected a composition.
     *
     * Confirmation is counted, not promoted. A hundred people accepting a
     * default is agreement with a default, not evidence it is right, so only a
     * named reviewer can make a recipe authoritative.
     */
    public function confirm(int $id, ?array $ingredients = null): ?RecipeCandidate
    {
        $row = RecipeCandidate::find($id);
        if (! $row || $row->isAuthoritative()) {
            return $row;
        }

        if ($ingredients !== null) {
            // A correction is a different recipe, so it starts its own row
            // rather than overwriting what everyone else is being shown.
            $row = RecipeCandidate::create([
                ...$row->only([
                    'dish', 'locale', 'variant', 'preparation',
                    'model_version', 'schema_version', 'serving_g',
                ]),
                'recipe_version' => $row->recipe_version + 1,
                'cache_key' => hash('sha256', $row->cache_key.'|'.json_encode($ingredients)),
                'state' => 'user_confirmed',
                'ingredients' => $ingredients,
                'assumptions' => $row->assumptions,
                'confirmations' => 1,
            ]);

            return $row;
        }

        $row->state = 'user_confirmed';
        $row->confirmations++;
        $row->save();

        return $row;
    }

    /** @return array{dish: string, ...} */
    private function present(RecipeCandidate $row, string $name): array
    {
        return [
            'dish' => $name,
            'recipeId' => $row->id,
            'state' => $row->state,
            'variant' => $row->variant,
            'preparation' => $row->preparation,
            'servingG' => $row->serving_g,
            'ingredients' => $row->ingredients,
            'assumptions' => $row->assumptions ?? [],
        ];
    }
}
