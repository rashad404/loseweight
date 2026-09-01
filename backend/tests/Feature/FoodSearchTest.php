<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The USDA proxy decides two things that become calorie figures a user sees:
 * which entry answers their word, and what its energy value means. Both have
 * been wrong before, so both are pinned here.
 */
class FoodSearchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['services.usda.key' => 'test-key']);
    }

    /** Shapes a USDA-like food. Energy in kJ is listed first, as USDA does. */
    private function food(string $name, float $kcal, int $id = 1): array
    {
        return [
            'fdcId' => $id,
            'description' => $name,
            'foodNutrients' => [
                ['nutrientName' => 'Energy', 'unitName' => 'kJ', 'value' => $kcal * 4.184],
                ['nutrientName' => 'Energy', 'unitName' => 'KCAL', 'value' => $kcal],
                ['nutrientName' => 'Protein', 'unitName' => 'G', 'value' => 3.0],
                ['nutrientName' => 'Fiber, total dietary', 'unitName' => 'G', 'value' => 1.0],
            ],
        ];
    }

    private function fake(array $foods): void
    {
        Http::fake([
            'api.nal.usda.gov/*' => Http::response(['foods' => $foods]),
        ]);
    }

    public function test_energy_is_read_in_kcal_not_kilojoules(): void
    {
        $this->fake([$this->food('Rice crackers', 416)]);

        $body = $this->getJson('/api/food/search?q=rice+crackers')->json();

        $this->assertEqualsWithDelta(416.0, $body['results'][0]['per100g']['kcal'], 0.05);
    }

    public function test_kilojoules_are_converted_when_no_kcal_entry_exists(): void
    {
        $this->fake([[
            'fdcId' => 9,
            'description' => 'Test food',
            'foodNutrients' => [['nutrientName' => 'Energy', 'unitName' => 'kJ', 'value' => 418.4]],
        ]]);

        $body = $this->getJson('/api/food/search?q=test+food')->json();

        $this->assertEqualsWithDelta(100.0, $body['results'][0]['per100g']['kcal'], 0.05);
    }

    public function test_the_plain_food_outranks_snacks_made_from_it(): void
    {
        // The real top of USDA's own ordering for "rice", plus the entry a
        // person actually means, which USDA buries.
        $this->fake([
            $this->food('Rice crackers', 416, 1),
            $this->food('Snacks, rice cakes, brown rice, buckwheat', 380, 2),
            $this->food('Rice, white, cooked', 130, 3),
        ]);

        $body = $this->getJson('/api/food/search?q=rice')->json();

        $this->assertSame('Rice, white, cooked', $body['results'][0]['name']);
        $this->assertTrue($body['strong']);
    }

    public function test_equally_good_candidates_are_not_marked_strong(): void
    {
        // Everything here begins "Chicken," and scores the same. USDA's own
        // order put the meatless product first, so trusting the top result
        // turned "chicken" into a vegetarian substitute.
        $this->fake([
            $this->food('Chicken, meatless', 224, 1),
            $this->food('Chicken, canned, no broth', 185, 2),
            $this->food('Chicken, ground, raw', 143, 3),
        ]);

        $body = $this->getJson('/api/food/search?q=chicken')->json();

        $this->assertFalse($body['strong']);
    }

    public function test_a_query_with_no_good_answer_is_not_marked_strong(): void
    {
        // Nothing here is chocolate itself, so the caller must ask the user
        // rather than silently pick chocolate syrup.
        $this->fake([
            $this->food('Beverages, chocolate syrup', 279, 1),
            $this->food('Cookies, chocolate wafers', 433, 2),
        ]);

        $body = $this->getJson('/api/food/search?q=chocolate')->json();

        $this->assertFalse($body['strong']);
        $this->assertNotEmpty($body['results']);
    }

    public function test_foods_without_an_energy_value_are_dropped(): void
    {
        $this->fake([
            ['fdcId' => 5, 'description' => 'Water', 'foodNutrients' => []],
            $this->food('Rice, white, cooked', 130, 3),
        ]);

        $body = $this->getJson('/api/food/search?q=rice')->json();

        $this->assertCount(1, $body['results']);
    }

    public function test_no_key_returns_nothing_rather_than_failing(): void
    {
        config(['services.usda.key' => null]);

        $body = $this->getJson('/api/food/search?q=rice')->json();

        $this->assertSame('unavailable', $body['source']);
        $this->assertFalse($body['strong']);
    }
}
