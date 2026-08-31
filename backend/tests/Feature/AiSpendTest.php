<?php

namespace Tests\Feature;

use App\Models\AiParseCache;
use App\Services\Ai\SpendLimiter;
use App\Services\Ai\TopicScreen;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiSpendTest extends TestCase
{
    use RefreshDatabase;

    private function limiter(): SpendLimiter
    {
        return app(SpendLimiter::class);
    }

    public function test_a_fresh_user_is_allowed(): void
    {
        $this->assertTrue($this->limiter()->check('u1')['allowed']);
    }

    public function test_the_per_user_spend_cap_holds(): void
    {
        $l = $this->limiter();
        $l->record('u1', 'parse-routine', 'm', 0, 0, SpendLimiter::PER_USER_DAILY_USD);

        $d = $l->check('u1');
        $this->assertFalse($d['allowed']);
        $this->assertSame('user-daily-spend', $d['reason']);
    }

    public function test_the_per_user_call_cap_holds(): void
    {
        $l = $this->limiter();
        for ($i = 0; $i < SpendLimiter::PER_USER_DAILY_CALLS; $i++) {
            $l->record('u2', 'parse-routine', 'm', 1, 1, 0.000001);
        }

        $this->assertSame('user-daily-calls', $l->check('u2')['reason']);
    }

    public function test_the_service_cap_stops_everyone_not_only_the_heavy_user(): void
    {
        $l = $this->limiter();
        $l->record('whale', 'parse-routine', 'm', 0, 0, SpendLimiter::SERVICE_DAILY_USD);

        $this->assertSame('service-daily-spend', $l->check('someone-else')['reason']);
    }

    public function test_cached_calls_cost_nothing_and_do_not_count(): void
    {
        $l = $this->limiter();
        for ($i = 0; $i < SpendLimiter::PER_USER_DAILY_CALLS + 5; $i++) {
            $l->record('u3', 'parse-routine', 'm', 999, 999, 0.05, cached: true);
        }

        $this->assertTrue($l->check('u3')['allowed'], 'cache hits must not exhaust a quota');
        $this->assertSame(0.0, $l->todayReport()['service_spend_usd']);
    }

    /**
     * The reason the ledger moved out of the Node process: an in-memory cap
     * resets on restart, so it is not a cap.
     */
    public function test_spend_survives_a_process_restart(): void
    {
        $this->limiter()->record('u4', 'parse-routine', 'm', 0, 0, SpendLimiter::PER_USER_DAILY_USD);

        // A brand new instance, as after a deploy or a pm2 restart.
        $fresh = new SpendLimiter;
        $this->assertFalse($fresh->check('u4')['allowed']);
    }

    public function test_spend_is_attributed_by_feature(): void
    {
        $l = $this->limiter();
        $l->record('u5', 'parse-routine', 'm', 10, 10, 0.001);
        $l->record('u5', 'explain-change', 'm', 10, 10, 0.002);

        $report = $l->todayReport();
        $this->assertSame(1, $report['by_feature']['parse-routine']['calls']);
        $this->assertGreaterThan(
            $report['by_feature']['parse-routine']['spend_usd'],
            $report['by_feature']['explain-change']['spend_usd'],
        );
    }

    public function test_refused_topics_never_reach_the_model(): void
    {
        $screen = new TopicScreen;

        foreach ([
            'should i take ozempic',
            'do i have insulin resistance',
            'my doctor said no carbs',
            'I have chest pain',
        ] as $text) {
            $this->assertFalse($screen->check($text)['allowed'], $text);
        }
    }

    public function test_emergencies_are_flagged_urgent(): void
    {
        $this->assertTrue((new TopicScreen)->check('I passed out and have chest pain')['urgent']);
    }

    public function test_ordinary_food_text_is_allowed(): void
    {
        $screen = new TopicScreen;

        foreach ([
            'breakfast is eggs and toast, lunch is a chicken sandwich',
            'I usually have plov for lunch and tea after',
        ] as $text) {
            $this->assertTrue($screen->check($text)['allowed'], $text);
        }
    }

    public function test_parse_requires_consent(): void
    {
        $this->postJson('/api/routine/parse', [
            'text' => 'breakfast is eggs and toast every morning',
            'user_key' => 'k1',
        ])->assertStatus(422);
    }

    public function test_parse_without_a_key_reports_unavailable_rather_than_failing(): void
    {
        config(['services.anthropic.key' => null]);

        $this->postJson('/api/routine/parse', [
            'text' => 'breakfast is eggs and toast every morning',
            'user_key' => 'k2',
            'consent' => true,
        ])->assertOk()->assertJsonPath('source', 'unavailable:no-key');
    }

    public function test_a_refused_topic_is_reported_as_refused(): void
    {
        $this->postJson('/api/routine/parse', [
            'text' => 'breakfast is eggs but should i take ozempic as well',
            'user_key' => 'k3',
            'consent' => true,
        ])->assertOk()->assertJsonPath('source', 'refused');
    }

    public function test_status_never_echoes_the_key(): void
    {
        config(['services.anthropic.key' => 'sk-ant-secret-value']);

        $body = $this->getJson('/api/ai/status')->assertOk()->content();

        $this->assertStringNotContainsString('sk-ant-secret-value', $body);
        $this->assertStringContainsString('live', $body);
    }

    /**
     * Regression: the model turned "2-3 cokes a day" into two coke items, one
     * with quantity 2 and one with 3, which double counted a single drink.
     */
    public function test_a_food_repeated_in_one_meal_is_collapsed(): void
    {
        $method = new \ReflectionMethod(\App\Services\Ai\RoutineParser::class, 'sanitise');
        $method->setAccessible(true);

        $result = $method->invoke(null, ['meals' => [[
            'slot' => 'drink',
            'items' => [
                ['text' => 'cokes', 'quantity' => 2, 'unit' => null, 'household' => null],
                ['text' => 'Cokes', 'quantity' => 3, 'unit' => null, 'household' => '2-3 a day'],
            ],
        ]]]);

        $items = $result['meals'][0]['items'];
        $this->assertCount(1, $items, 'one food counted twice is one food');
        $this->assertSame(3.0, $items[0]['quantity'], 'keeps the larger stated quantity');
        $this->assertSame('2-3 a day', $items[0]['household']);
    }

    public function test_an_identical_description_is_served_from_cache(): void
    {
        AiParseCache::create([
            'input_hash' => hash('sha256', 'breakfast is eggs and toast'),
            'feature' => 'parse-routine',
            'result' => ['meals' => [['slot' => 'breakfast', 'whenDescribed' => null, 'items' => [['text' => 'eggs', 'quantity' => null, 'unit' => null, 'household' => null]]]], 'nonNegotiables' => []],
            'model' => 'test',
        ]);

        $this->postJson('/api/routine/parse', [
            'text' => '  Breakfast is EGGS and toast  ',
            'user_key' => 'k4',
            'consent' => true,
        ])->assertOk()->assertJsonPath('source', 'cache');
    }
}
