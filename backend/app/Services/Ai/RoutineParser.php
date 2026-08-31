<?php

namespace App\Services\Ai;

use App\Models\AiParseCache;

/**
 * Turns a description of how someone normally eats into structured meals.
 *
 * Parsing decides what the user said. It never decides what the food contains:
 * nutrition is resolved afterwards from verified sources, so a parsing mistake
 * cannot become an invented calorie figure.
 */
class RoutineParser
{
    private const FEATURE = 'parse-routine';

    private const SYSTEM = <<<'TXT'
You convert a person's description of how they normally eat into structured data.

Rules:
- Return only what the person said. Never add foods they did not mention.
- Never estimate calories, protein, or any nutrition value. That is done elsewhere.
- Keep the person's own wording in "text". Do not translate or rename foods.
- Set quantity and unit only when the person stated them. Otherwise use null.
- Put descriptive amounts such as "a bowl" or "two slices" in "household".
- Slot must be one of: breakfast, lunch, dinner, snack, drink.
- If a time is mentioned, keep it verbatim in whenDescribed. Do not invent times.
- List foods the person says they will not give up in nonNegotiables.

Shape:
{"meals":[{"slot":"breakfast","whenDescribed":null,"items":[{"text":"","quantity":null,"unit":null,"household":null}]}],"nonNegotiables":[]}
TXT;

    public function __construct(
        private readonly AnthropicClient $client,
        private readonly SpendLimiter $limiter,
        private readonly TopicScreen $screen,
    ) {}

    /** @return array{routine: array, source: string, refused: array<string>, urgent: bool} */
    public function parse(string $text, string $userKey): array
    {
        // Runs before anything leaves the process.
        $screened = $this->screen->check($text);
        if (! $screened['allowed']) {
            return [
                'routine' => ['meals' => [], 'nonNegotiables' => []],
                'source' => 'refused',
                'refused' => $screened['topics'],
                'urgent' => $screened['urgent'],
            ];
        }

        $hash = hash('sha256', self::normalise($text));

        // Cache before spend: an identical description is never billed twice,
        // whoever submits it.
        if ($cached = AiParseCache::where('input_hash', $hash)->first()) {
            $cached->increment('hits');
            $this->limiter->record($userKey, self::FEATURE, $cached->model, 0, 0, 0, true);

            return ['routine' => $cached->result, 'source' => 'cache', 'refused' => [], 'urgent' => false];
        }

        if (! $this->client->available()) {
            return $this->unavailable('no-key');
        }

        $decision = $this->limiter->check($userKey);
        if (! $decision['allowed']) {
            return $this->unavailable($decision['reason']);
        }

        try {
            $result = $this->client->structured(self::SYSTEM, $text, 'ParsedRoutine');
        } catch (\RuntimeException $e) {
            return $this->unavailable($e->getMessage());
        }

        $routine = self::sanitise($result['data']);

        $this->limiter->record(
            $userKey, self::FEATURE, $result['model'],
            $result['input_tokens'], $result['output_tokens'],
            $this->client->cost($result['model'], $result['input_tokens'], $result['output_tokens']),
        );

        AiParseCache::create([
            'input_hash' => $hash,
            'feature' => self::FEATURE,
            'result' => $routine,
            'model' => $result['model'],
        ]);

        return ['routine' => $routine, 'source' => 'model', 'refused' => [], 'urgent' => false];
    }

    /**
     * The client falls back to its own deterministic parser when this returns
     * unavailable, so onboarding never shows an error on its first screen.
     */
    private function unavailable(string $reason): array
    {
        return [
            'routine' => ['meals' => [], 'nonNegotiables' => []],
            'source' => "unavailable:{$reason}",
            'refused' => [],
            'urgent' => false,
        ];
    }

    private static function normalise(string $text): string
    {
        return mb_substr(preg_replace('/\s+/u', ' ', mb_strtolower(trim($text))), 0, 1000);
    }

    /** Never trust the shape a model returns. */
    private static function sanitise(array $raw): array
    {
        $slots = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];

        $meals = collect($raw['meals'] ?? [])
            ->filter(fn ($m) => is_array($m) && in_array($m['slot'] ?? null, $slots, true))
            ->map(fn ($m) => [
                'slot' => $m['slot'],
                'whenDescribed' => is_string($m['whenDescribed'] ?? null) ? mb_substr($m['whenDescribed'], 0, 60) : null,
                'items' => collect($m['items'] ?? [])
                    ->filter(fn ($i) => is_array($i) && is_string($i['text'] ?? null) && mb_strlen(trim($i['text'])) > 1)
                    ->take(12)
                    ->map(fn ($i) => [
                        'text' => mb_substr($i['text'], 0, 120),
                        'quantity' => is_numeric($i['quantity'] ?? null) ? (float) $i['quantity'] : null,
                        'unit' => is_string($i['unit'] ?? null) ? mb_substr($i['unit'], 0, 20) : null,
                        'household' => is_string($i['household'] ?? null) ? mb_substr($i['household'], 0, 40) : null,
                    ])->values()->all(),
            ])
            ->filter(fn ($m) => $m['items'] !== [])
            ->take(8)->values()->all();

        $keep = collect($raw['nonNegotiables'] ?? [])
            ->filter(fn ($s) => is_string($s) && mb_strlen(trim($s)) > 1)
            ->map(fn ($s) => mb_substr($s, 0, 60))
            ->take(10)->values()->all();

        return ['meals' => $meals, 'nonNegotiables' => $keep];
    }
}
