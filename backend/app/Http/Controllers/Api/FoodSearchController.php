<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * USDA FoodData Central proxy.
 *
 * Exists because the key lives here. The frontend keeps its embedded
 * common-foods table and the curated Azerbaijani dishes, which need no secret
 * and resolve instantly; only a food neither of those knows reaches this.
 *
 * Returns nutrition per 100 g and lets the caller scale it. Portion reasoning
 * and uncertainty belong with the caller, not with the data source.
 *
 * It returns several ranked candidates rather than one answer, and says
 * whether the best of them is actually a good match. USDA's own relevance
 * order is not trustworthy for plain words: searching "rice" returns rice
 * crackers and rice cakes for twenty-five results before any cooked rice, so
 * taking the top hit silently turns "rice" into a 400 kcal snack food.
 */
class FoodSearchController extends Controller
{
    private const ENDPOINT = 'https://api.nal.usda.gov/fdc/v1/foods/search';

    /** Enough to look past USDA's snack-heavy relevance ordering. */
    private const POOL = 25;

    private const RETURNED = 8;

    public function search(Request $request)
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:80'],
        ]);

        $key = config('services.usda.key');
        if (blank($key)) {
            return response()->json(['results' => [], 'strong' => false, 'source' => 'unavailable']);
        }

        $query = mb_strtolower(trim($data['q']));

        // USDA data does not change, so a long cache is safe and keeps the
        // request count low. v2 because the earlier cache holds figures from
        // before the kilojoule bug below was fixed.
        $results = Cache::remember("usda:v2:{$query}", now()->addDays(30), function () use ($query, $key) {
            $response = Http::timeout(10)->get(self::ENDPOINT, [
                'api_key' => $key,
                'query' => $query,
                'pageSize' => self::POOL,
                'dataType' => 'Foundation,SR Legacy',
            ]);

            if (! $response->successful()) {
                return null;
            }

            return collect($response->json('foods') ?? [])
                ->map(fn ($food) => [
                    'id' => (string) ($food['fdcId'] ?? ''),
                    'name' => $food['description'] ?? '',
                    'per100g' => [
                        'kcal' => self::energy($food),
                        'proteinG' => self::nutrient($food, 'protein'),
                        'fiberG' => self::nutrient($food, 'fiber'),
                    ],
                ])
                // A food with no energy value is useless downstream and would
                // otherwise resolve to a confident looking zero.
                ->filter(fn ($f) => $f['per100g']['kcal'] > 0 && $f['name'] !== '')
                ->map(fn ($f) => $f + ['score' => self::score($query, $f['name'])])
                ->sortByDesc('score')
                ->take(self::RETURNED)
                ->values()->all();
        });

        if ($results === null) {
            Cache::forget("usda:v2:{$query}");

            return response()->json(['results' => [], 'strong' => false, 'source' => 'error']);
        }

        return response()->json([
            'results' => $results,
            'strong' => self::isStrong($results),
            'source' => 'usda',
        ]);
    }

    /**
     * Whether the caller may use the first result without asking the user.
     *
     * A high score is not enough on its own. Searching "chicken" scores every
     * entry beginning "Chicken," equally, and the winner is then decided by
     * USDA's arbitrary order, which put "Chicken, meatless" first. Several
     * equally good candidates is ambiguity, so the top result has to be
     * clearly ahead of the next one as well as good in itself.
     */
    private static function isStrong(array $results): bool
    {
        if ($results === []) {
            return false;
        }

        $top = $results[0]['score'];
        $second = $results[1]['score'] ?? 0;

        return $top >= 80 && $top - $second >= 10;
    }

    /**
     * Energy in kcal.
     *
     * USDA returns Energy twice, in kJ and in kcal, and the kJ entry usually
     * comes first. Matching on the name alone returned the kilojoule figure and
     * every remote food came out 4.184 times too large.
     */
    private static function energy(array $food): float
    {
        $kj = null;

        foreach ($food['foodNutrients'] ?? [] as $n) {
            if (! str_contains(mb_strtolower($n['nutrientName'] ?? ''), 'energy')) {
                continue;
            }

            $unit = mb_strtoupper($n['unitName'] ?? '');
            if ($unit === 'KCAL') {
                return (float) ($n['value'] ?? 0);
            }
            if ($unit === 'KJ') {
                $kj = (float) ($n['value'] ?? 0);
            }
        }

        return $kj === null ? 0.0 : round($kj / 4.184, 1);
    }

    private static function nutrient(array $food, string $needle): float
    {
        foreach ($food['foodNutrients'] ?? [] as $n) {
            if (str_contains(mb_strtolower($n['nutrientName'] ?? ''), $needle)) {
                return (float) ($n['value'] ?? 0);
            }
        }

        return 0.0;
    }

    /**
     * How well a USDA description answers the query, 0 to 100.
     *
     * The question being scored is "is this the food they named, or something
     * made from it". "Rice, white, cooked" answers "rice"; "Snacks, rice cakes,
     * brown rice" does not, even though USDA ranks it first.
     */
    private static function score(string $query, string $name): int
    {
        $clean = fn (string $s) => trim(preg_replace('/[^\p{L}\p{N} ]+/u', ' ', mb_strtolower($s)));
        $q = $clean($query);
        $n = $clean($name);

        if ($q === $n) {
            return 100;
        }

        // USDA writes "Rice, white, cooked": the food itself comes first and
        // qualifiers follow. A description whose first comma-separated segment
        // is the query is the plain form of it.
        $head = $clean(explode(',', $name)[0]);
        if ($head === $q) {
            return 90;
        }

        $words = preg_split('/\s+/u', $n, -1, PREG_SPLIT_NO_EMPTY);
        $qWords = preg_split('/\s+/u', $q, -1, PREG_SPLIT_NO_EMPTY);

        $present = count(array_intersect($qWords, $words));
        if ($present === 0) {
            return 0;
        }

        // All query words present, but wrapped in other words. The more extra
        // words, the further from what was asked.
        $coverage = $present / max(count($qWords), 1);
        $extra = max(count($words) - count($qWords), 0);

        return (int) round($coverage * 70 - min($extra * 6, 45));
    }
}
