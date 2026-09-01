<?php

namespace Tests\Feature;

use App\Services\Ai\RoutineParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The sanitiser is the only thing standing between a model's output and a
 * calorie figure, so it is tested against the shapes a model actually gets
 * wrong rather than against well-formed input.
 */
class RoutineParseSanitiseTest extends TestCase
{
    use RefreshDatabase;

    private function sanitise(array $raw): array
    {
        $m = new \ReflectionMethod(RoutineParser::class, 'sanitise');

        return $m->invoke(null, $raw);
    }

    private function meal(array $items): array
    {
        return ['meals' => [['slot' => 'lunch', 'whenDescribed' => null, 'items' => $items]]];
    }

    public function test_a_canonical_name_and_confidence_survive(): void
    {
        $out = $this->sanitise($this->meal([
            ['text' => 'yağ', 'canonical' => 'butter', 'preparation' => null, 'confidence' => 0.94],
        ]));

        $item = $out['meals'][0]['items'][0];
        $this->assertSame('yağ', $item['text'], "the person's own words are never replaced");
        $this->assertSame('butter', $item['canonical']);
        $this->assertSame(0.94, $item['confidence']);
    }

    public function test_an_absent_confidence_means_the_model_was_sure(): void
    {
        // The prompt asks for confidence only below 0.8, so silence is
        // certainty. Emitting 0.95 on every item cost tokens and said nothing.
        $out = $this->sanitise($this->meal([['text' => 'plov', 'canonical' => 'rice dish']]));

        $this->assertSame(1.0, $out['meals'][0]['items'][0]['confidence']);
    }

    public function test_a_stated_low_confidence_is_kept(): void
    {
        $out = $this->sanitise($this->meal([['text' => 'corek', 'confidence' => 0.6]]));

        $this->assertSame(0.6, $out['meals'][0]['items'][0]['confidence']);
    }

    public function test_confidence_is_clamped(): void
    {
        $out = $this->sanitise($this->meal([['text' => 'tea', 'confidence' => 7]]));

        $this->assertSame(1.0, $out['meals'][0]['items'][0]['confidence']);
    }

    private function withDish(array $dish): array
    {
        return $this->meal([['text' => 'plov', 'canonical' => null, 'dish' => 'plov']]) + ['dishes' => [$dish]];
    }

    private function goodDish(array $over = []): array
    {
        return array_merge([
            'dish' => 'plov',
            'variant' => null,
            'preparation' => null,
            'servingG' => 320,
            'ingredients' => [['food' => 'cooked white rice', 'gramsLow' => 180, 'gramsHigh' => 260]],
            'assumptions' => ['Cooking fat was not stated.'],
        ], $over);
    }

    public function test_a_usable_composition_is_kept(): void
    {
        $out = $this->sanitise($this->withDish($this->goodDish()));

        $this->assertCount(1, $out['dishes']);
        $this->assertSame(320, $out['dishes'][0]['servingG']);
        $this->assertSame(['Cooking fat was not stated.'], $out['dishes'][0]['assumptions']);
    }

    public function test_a_backwards_gram_range_is_dropped(): void
    {
        // It would still multiply cleanly against a real USDA figure and
        // produce a confident wrong number.
        $out = $this->sanitise($this->withDish($this->goodDish([
            'ingredients' => [['food' => 'rice', 'gramsLow' => 300, 'gramsHigh' => 100]],
        ])));

        $this->assertSame([], $out['dishes']);
    }

    public function test_an_absurd_ingredient_weight_is_dropped(): void
    {
        $out = $this->sanitise($this->withDish($this->goodDish([
            'ingredients' => [['food' => 'rice', 'gramsLow' => 1, 'gramsHigh' => 5000]],
        ])));

        $this->assertSame([], $out['dishes']);
    }

    public function test_a_composition_with_no_serving_size_is_dropped(): void
    {
        $out = $this->sanitise($this->withDish($this->goodDish(['servingG' => 0])));

        $this->assertSame([], $out['dishes']);
    }

    public function test_a_composition_nothing_refers_to_is_dropped(): void
    {
        $raw = $this->meal([['text' => 'bread', 'canonical' => 'bread']]) + ['dishes' => [$this->goodDish()]];

        $this->assertSame([], $this->sanitise($raw)['dishes']);
    }

    public function test_a_repeated_range_is_still_one_item(): void
    {
        $out = $this->sanitise($this->meal([
            ['text' => 'coke', 'canonical' => 'cola', 'quantity' => 2],
            ['text' => 'coke', 'canonical' => 'cola', 'quantity' => 3],
        ]));

        $this->assertCount(1, $out['meals'][0]['items']);
        $this->assertSame(3.0, $out['meals'][0]['items'][0]['quantity']);
    }
}
