<?php

namespace Tests\Feature;

use App\Models\RecipeCandidate;
use App\Services\Ai\RecipeStore;
use App\Services\Ai\RoutineParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A dish composition proposed by a model must never become permanent nutrition
 * data on its own. These pin the states that decide who sees what.
 */
class RecipeCandidateTest extends TestCase
{
    use RefreshDatabase;

    private function store(): RecipeStore
    {
        return app(RecipeStore::class);
    }

    private function plov(array $over = []): array
    {
        return array_merge([
            'dish' => 'plov',
            'variant' => 'meat plov',
            'preparation' => null,
            'servingG' => 320,
            'ingredients' => [
                ['food' => 'cooked white rice', 'gramsLow' => 180, 'gramsHigh' => 260],
                ['food' => 'cooked lamb', 'gramsLow' => 50, 'gramsHigh' => 100],
            ],
            'assumptions' => ['The type of cooking fat was not stated.'],
        ], $over);
    }

    public function test_a_first_proposal_is_stored_as_a_candidate_not_as_fact(): void
    {
        [$dish] = $this->store()->reconcile([$this->plov()], 'az', 'test-model');

        $this->assertSame('generated', $dish['state']);
        $this->assertNotNull($dish['recipeId']);
    }

    public function test_the_same_dish_is_not_stored_twice(): void
    {
        $this->store()->reconcile([$this->plov()], 'az', 'test-model');
        $this->store()->reconcile([$this->plov()], 'az', 'test-model');

        $this->assertSame(1, RecipeCandidate::where('dish', 'plov')->count());
        $this->assertSame(2, RecipeCandidate::first()->hits);
    }

    public function test_a_different_variant_is_a_different_recipe(): void
    {
        $this->store()->reconcile([$this->plov()], 'az', 'test-model');
        $this->store()->reconcile([$this->plov(['variant' => 'vegetarian plov'])], 'az', 'test-model');

        $this->assertSame(2, RecipeCandidate::where('dish', 'plov')->count());
    }

    public function test_a_new_prompt_version_does_not_reuse_the_old_composition(): void
    {
        // The key carries the schema version, so raising it retires old rows
        // rather than silently serving what a previous prompt produced.
        $a = RecipeCandidate::keyFor([
            'dish' => 'plov', 'locale' => 'az', 'variant' => null, 'preparation' => null,
            'model_version' => 'm', 'schema_version' => RoutineParser::SCHEMA_VERSION,
        ]);
        $b = RecipeCandidate::keyFor([
            'dish' => 'plov', 'locale' => 'az', 'variant' => null, 'preparation' => null,
            'model_version' => 'm', 'schema_version' => RoutineParser::SCHEMA_VERSION + 1,
        ]);

        $this->assertNotSame($a, $b);
    }

    public function test_a_reviewed_recipe_overrides_what_the_model_proposed(): void
    {
        RecipeCandidate::create([
            'dish' => 'plov', 'locale' => 'az', 'variant' => null, 'preparation' => null,
            'model_version' => 'human', 'schema_version' => RoutineParser::SCHEMA_VERSION,
            'recipe_version' => 1, 'cache_key' => 'reviewed-plov', 'state' => 'reviewed',
            'ingredients' => [['food' => 'cooked white rice', 'gramsLow' => 200, 'gramsHigh' => 200]],
            'assumptions' => [], 'serving_g' => 300, 'reviewed_by' => 'A Reviewer',
        ]);

        [$dish] = $this->store()->reconcile([$this->plov()], 'az', 'test-model');

        $this->assertSame('reviewed', $dish['state']);
        $this->assertCount(1, $dish['ingredients'], 'the reviewed composition is used, not the proposal');
        $this->assertSame(300, $dish['servingG']);
    }

    public function test_a_reviewed_recipe_in_another_locale_does_not_apply(): void
    {
        RecipeCandidate::create([
            'dish' => 'plov', 'locale' => 'ru', 'variant' => null, 'preparation' => null,
            'model_version' => 'human', 'schema_version' => RoutineParser::SCHEMA_VERSION,
            'recipe_version' => 1, 'cache_key' => 'reviewed-plov-ru', 'state' => 'reviewed',
            'ingredients' => [['food' => 'cooked white rice', 'gramsLow' => 200, 'gramsHigh' => 200]],
            'assumptions' => [], 'serving_g' => 300,
        ]);

        [$dish] = $this->store()->reconcile([$this->plov()], 'az', 'test-model');

        $this->assertSame('generated', $dish['state']);
    }

    public function test_accepting_a_recipe_never_makes_it_authoritative(): void
    {
        [$dish] = $this->store()->reconcile([$this->plov()], 'az', 'test-model');

        for ($i = 0; $i < 50; $i++) {
            $this->store()->confirm($dish['recipeId']);
        }

        $row = RecipeCandidate::find($dish['recipeId']);
        $this->assertSame('user_confirmed', $row->state);
        $this->assertFalse($row->isAuthoritative(), 'popularity is not review');
    }

    public function test_a_correction_starts_its_own_recipe_rather_than_overwriting(): void
    {
        [$dish] = $this->store()->reconcile([$this->plov()], 'az', 'test-model');
        $corrected = [['food' => 'cooked white rice', 'gramsLow' => 120, 'gramsHigh' => 150]];

        $new = $this->store()->confirm($dish['recipeId'], $corrected);

        $this->assertNotSame($dish['recipeId'], $new->id);
        $this->assertSame(2, $new->recipe_version);
        $original = RecipeCandidate::find($dish['recipeId']);
        $this->assertCount(2, $original->ingredients, 'one user does not rewrite what others see');
    }
}
