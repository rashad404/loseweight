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

    /**
     * Bumped whenever the shape or the instructions change. It is part of every
     * recipe cache key, so a revised prompt cannot keep serving compositions
     * written by the old one.
     */
    public const SCHEMA_VERSION = 2;

    /**
     * Reading the meals, and composing the dishes, are asked separately.
     *
     * They used to be one reply of about 1350 tokens, and latency here is
     * output tokens at roughly 8ms each, so it took 11 seconds. Both prompts
     * see the same text and run at the same time, so the wait is now the longer
     * of the two rather than their sum.
     *
     * Both are told to omit fields they have nothing to say about. Emitting
     * "preparation":null,"quantity":null,"unit":null,"household":null on every
     * item cost about 25 tokens each and carried no information.
     */
    private const SYSTEM_ITEMS = <<<'TXT'
You convert a person's description of how they normally eat into structured data.
They may write in English, Azerbaijani or Russian.

Never estimate calories, protein, or any nutrition value. Those come from a food
database, not from you. Your job is to say what the food is, in terms that
database can be searched with.

For every item:
- "text" is the person's own words for the FOOD only, verbatim. Never translate
  or correct it, and never include the time word: "seherler sirin cay" is the
  item "sirin cay" in the breakfast slot.
- "canonical" is a searchable English food name. Resolve the ambiguity that
  context settles: bread with cheese and "yağ" at breakfast is butter, not
  cooking oil. Say which form it is when that changes the food: "cooked white
  rice", not "rice"; "brewed coffee", not "coffee".
- Set "quantity" and "unit" only when the person stated them. Put "a bowl" or
  "two slices" in "household".
- A dish is ONE named preparation people cook or order by that name (plov,
  dovga, lasagna, borscht), OR a food or drink with something mixed into it that
  a record for the plain version would not include: sugar in tea, milk in
  coffee, honey in yogurt. Those added calories are usually the point.
  For those, leave "canonical" out and set "dish" to the person's own word for
  it, lowercased, exactly as they wrote it: "plov", "dovga", "sirin cay".
- Foods eaten alongside each other are NOT a dish. "bread with butter and tea"
  is three separate items. The test is whether the extra thing is IN the food or
  merely NEXT to it.
- If the person's words say a food is sweetened or has something added, the
  canonical name must not quietly drop it. "şirin çay" is sweet tea, so it is a
  dish, never "brewed tea" on its own.
- Name the regional form when it differs from the usual English one. Azerbaijani
  "pendir" is white brined cheese, not cheddar, and "çörək" is a plain wheat
  flatbread. Choosing the wrong form changes the calories.

Other rules:
- Return only what the person said. Never add foods they did not mention.
- Slot must be one of: breakfast, lunch, dinner, snack, drink.
- If a time is mentioned, keep it verbatim in whenDescribed. Do not invent times.
- A range like "2-3 cokes" is one item with the higher number, never two items.
- List foods the person says they will not give up in nonNegotiables.

Keep the reply short. Omit any field you have nothing to say about rather than
writing null. Include "confidence" (0 to 1) only when you are below 0.8 sure the
canonical name is what they meant.

Shape, with every optional field omitted:
{"meals":[{"slot":"breakfast","items":[{"text":"","canonical":""}]}],"nonNegotiables":[]}
TXT;

    private const SYSTEM_DISHES = <<<'TXT'
You are given a person's description of how they normally eat. List only the
composite dishes in it and what is in one normal serving. Ignore everything else.

A dish is ONE named preparation people cook or order by that name (plov, dovga,
lasagna, borscht), OR a food or drink with something mixed into it that a record
for the plain version would not include: sugar in tea, milk in coffee, honey in
yogurt. Azerbaijani "şirin çay" is sweet tea and belongs here, and people often
type Azerbaijani without its diacritics, so "sirin cay", "corek" and "dusbere"
mean the same as "şirin çay", "çörək" and "düşbərə".

Foods merely eaten alongside each other are not a dish. "bread with butter and
tea" is three ordinary foods, so return nothing for it.

Never estimate calories or any nutrition value. A food database supplies those.

For each dish:
- "dish" is the person's own word for it, lowercased, exactly as they wrote it,
  without the time word: "plov", "dovga", "sirin cay". Do not translate it.
- "ingredients" is what is in one normal serving, each with a searchable English
  "food" name and a gram range, "gramsLow" and "gramsHigh". Give a real range:
  household recipes vary.
- Every ingredient name must be specific enough to find in a food database.
  Bare words like "meat", "oil or fat" and "vegetables" find nothing and drop
  silently out of the total. Name the animal: "lamb, cooked", "beef, ground,
  cooked". Name the fat: "butter" or "sunflower oil", never "oil or fat". Say
  the state, and the right one: "carrot, raw", not "carrot, dehydrated".
- "servingG" is the total grams of the serving those ingredients describe.
- "variant" names which version you assumed, such as "meat plov", when it
  matters. Omit it otherwise.
- "assumptions" says what you had to assume and the person did not say. At most
  two, each under twelve words. They are shown to the person unchanged, so write
  them in the language named below.

If the description contains no composite dish, return {"dishes":[]}.

Shape:
{"dishes":[{"dish":"","servingG":0,"ingredients":[{"food":"","gramsLow":0,"gramsHigh":0}],"assumptions":[]}]}
TXT;

    public function __construct(
        private readonly AnthropicClient $client,
        private readonly SpendLimiter $limiter,
        private readonly TopicScreen $screen,
        private readonly RecipeStore $recipes,
    ) {}

    /** @return array{routine: array, source: string, refused: array<string>, urgent: bool} */
    public function parse(string $text, string $userKey, string $locale = 'en'): array
    {
        // Runs before anything leaves the process.
        $screened = $this->screen->check($text);
        if (! $screened['allowed']) {
            return [
                'routine' => ['meals' => [], 'dishes' => [], 'nonNegotiables' => []],
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

            // Recipes are reconciled again rather than served from the parse
            // cache, so a recipe reviewed since this text was first parsed is
            // used instead of the composition the model proposed back then.
            $routine = $cached->result;
            $routine['dishes'] = $this->recipes->reconcile($routine['dishes'] ?? [], $locale, $cached->model);

            return ['routine' => $routine, 'source' => 'cache', 'refused' => [], 'urgent' => false];
        }

        if (! $this->client->available()) {
            return $this->unavailable('no-key');
        }

        $decision = $this->limiter->check($userKey);
        if (! $decision['allowed']) {
            return $this->unavailable($decision['reason']);
        }

        try {
            // Dish compositions made the reply several times longer than the old
            // item-only shape. At the previous limit a routine with two dishes
            // ran out of tokens mid-JSON and fell back to the offline parser.
            // Both halves see the same text and run together, so the wait is
            // the longer of the two rather than their sum.
            $replies = $this->client->structuredPool([
                'items' => [self::SYSTEM_ITEMS, $text, 1500],
                'dishes' => [self::dishSystem($locale), $text, 1500],
            ], 'ParsedRoutine');
        } catch (\RuntimeException $e) {
            return $this->unavailable($e->getMessage());
        }

        // Reading the meals is the half that cannot be done without. A failed
        // dish call only means composite dishes fall back to a plain lookup.
        if ($replies['items'] === null) {
            return $this->unavailable('request-failed');
        }

        $routine = self::sanitise(
            $replies['items']['data'] + ['dishes' => $replies['dishes']['data']['dishes'] ?? []],
        );

        $model = $replies['items']['model'];
        $input = collect($replies)->filter()->sum('input_tokens');
        $output = collect($replies)->filter()->sum('output_tokens');

        $this->limiter->record(
            $userKey, self::FEATURE, $model,
            $input, $output, $this->client->cost($model, $input, $output),
        );

        AiParseCache::create([
            'input_hash' => $hash,
            'feature' => self::FEATURE,
            'result' => $routine,
            'model' => $model,
        ]);

        $routine['dishes'] = $this->recipes->reconcile($routine['dishes'], $locale, $model);

        return ['routine' => $routine, 'source' => 'model', 'refused' => [], 'urgent' => false];
    }

    /**
     * The client falls back to its own deterministic parser when this returns
     * unavailable, so onboarding never shows an error on its first screen.
     */
    private function unavailable(string $reason): array
    {
        return [
            'routine' => ['meals' => [], 'dishes' => [], 'nonNegotiables' => []],
            'source' => "unavailable:{$reason}",
            'refused' => [],
            'urgent' => false,
        ];
    }

    /**
     * The dish prompt, with the language for its assumptions named outright.
     *
     * Asking for "the language the person wrote in" produced Turkish for an
     * Azerbaijani routine: the two look close enough that a model slides
     * between them, and Turkish reads as foreign to an Azerbaijani speaker.
     * The language is stated, and the near neighbour is ruled out by name.
     */
    private static function dishSystem(string $locale): string
    {
        $language = match ($locale) {
            'az' => <<<'TXT'
Azerbaijani. Not Turkish. They are different languages, and Turkish wording
reads as foreign to an Azerbaijani speaker. Write "sirin" as şirin, not tatlı;
şəkər, not şeker; stəkan, not fincan. Use ə, ğ, ı, ö, ş and ü correctly.
TXT,
            'ru' => 'Russian.',
            default => 'English.',
        };

        return self::SYSTEM_DISHES."\n\nWrite every assumption in this language: {$language}";
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
                    ->map(fn ($i) => [
                        'text' => mb_substr($i['text'], 0, 120),
                        'canonical' => self::str($i['canonical'] ?? null, 80),
                        'preparation' => self::str($i['preparation'] ?? null, 30),
                        // The prompt asks for confidence only when the model is
                        // unsure, so its absence means sure. Emitting 0.95 on
                        // every item cost tokens and told us nothing.
                        'confidence' => self::confidence($i['confidence'] ?? null),
                        'quantity' => is_numeric($i['quantity'] ?? null) ? (float) $i['quantity'] : null,
                        'unit' => self::str($i['unit'] ?? null, 20),
                        'household' => self::str($i['household'] ?? null, 40),
                        'dish' => self::str($i['dish'] ?? null, 60),
                    ])
                    // A range returned as two items is one food counted twice.
                    // The prompt asks the model not to do it; this makes sure.
                    ->groupBy(fn ($i) => mb_strtolower(trim($i['text'])))
                    ->map(fn ($group) => [
                        'text' => $group->first()['text'],
                        'canonical' => $group->pluck('canonical')->filter()->first(),
                        'preparation' => $group->pluck('preparation')->filter()->first(),
                        'confidence' => $group->pluck('confidence')->max(),
                        'quantity' => $group->pluck('quantity')->filter()->max(),
                        'unit' => $group->pluck('unit')->filter()->first(),
                        'household' => $group->pluck('household')->filter()->first(),
                        'dish' => $group->pluck('dish')->filter()->first(),
                    ])
                    ->take(12)->values()->all(),
            ])
            ->filter(fn ($m) => $m['items'] !== [])
            ->take(8)->values()->all();

        $keep = collect($raw['nonNegotiables'] ?? [])
            ->filter(fn ($s) => is_string($s) && mb_strlen(trim($s)) > 1)
            ->map(fn ($s) => mb_substr($s, 0, 60))
            ->take(10)->values()->all();

        return [
            'meals' => $meals,
            'dishes' => self::dishes($raw['dishes'] ?? [], $meals),
            'nonNegotiables' => $keep,
        ];
    }

    /**
     * Dish compositions, kept only when they are usable arithmetic.
     *
     * A composition whose grams are missing, reversed or absurd would still
     * multiply cleanly against a real USDA figure and produce a confident wrong
     * number, so it is dropped here rather than corrected into something the
     * model never said.
     */
    private static function dishes(mixed $raw, array $meals): array
    {
        // Matched against the person's own wording as well as the dish name,
        // because the two halves are asked separately and can word it
        // differently. Requiring an exact agreement threw away every
        // composition when one said "sweet tea" and the other "sirin cay".
        $referenced = collect($meals)
            ->flatMap(fn ($m) => collect($m['items'])->flatMap(fn ($i) => [$i['dish'], $i['text']]))
            ->filter()->map(fn ($d) => mb_strtolower(trim($d)))->unique();

        return collect(is_array($raw) ? $raw : [])
            ->filter(fn ($d) => is_array($d) && is_string($d['dish'] ?? null))
            // A composition nothing refers to is not wrong, just unused.
            ->filter(fn ($d) => $referenced->contains(mb_strtolower($d['dish'])))
            ->map(function ($d) {
                $ingredients = collect($d['ingredients'] ?? [])
                    ->filter(fn ($i) => is_array($i)
                        && is_string($i['food'] ?? null)
                        && mb_strlen(trim($i['food'])) > 1
                        && is_numeric($i['gramsLow'] ?? null)
                        && is_numeric($i['gramsHigh'] ?? null))
                    ->map(fn ($i) => [
                        'food' => mb_substr(trim($i['food']), 0, 80),
                        'gramsLow' => (float) $i['gramsLow'],
                        'gramsHigh' => (float) $i['gramsHigh'],
                    ])
                    // A single ingredient weighing more than a kilogram, or a
                    // range running backwards, is a parse failure not a recipe.
                    ->filter(fn ($i) => $i['gramsLow'] > 0
                        && $i['gramsHigh'] >= $i['gramsLow']
                        && $i['gramsHigh'] <= 1000)
                    ->take(15)->values()->all();

                return [
                    'dish' => mb_substr(trim($d['dish']), 0, 60),
                    'variant' => self::str($d['variant'] ?? null, 60),
                    'preparation' => self::str($d['preparation'] ?? null, 30),
                    'servingG' => (int) round((float) ($d['servingG'] ?? 0)),
                    'ingredients' => $ingredients,
                    'assumptions' => collect($d['assumptions'] ?? [])
                        ->filter(fn ($a) => is_string($a) && trim($a) !== '')
                        ->map(fn ($a) => mb_substr(trim($a), 0, 200))
                        ->take(6)->values()->all(),
                ];
            })
            ->filter(fn ($d) => $d['ingredients'] !== [] && $d['servingG'] > 0 && $d['servingG'] <= 3000)
            ->take(8)->values()->all();
    }

    private static function str(mixed $v, int $max): ?string
    {
        if (! is_string($v)) {
            return null;
        }
        $v = trim($v);

        return $v === '' ? null : mb_substr($v, 0, $max);
    }

    private static function confidence(mixed $v): float
    {
        if (! is_numeric($v)) {
            return 1.0;
        }

        return round(max(0.0, min(1.0, (float) $v)), 2);
    }
}
