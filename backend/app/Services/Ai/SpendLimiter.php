<?php

namespace App\Services\Ai;

use App\Models\AiUsage;
use Illuminate\Support\Carbon;

/**
 * Durable spend limits.
 *
 * Every figure is read from the database, so a restart cannot reset a cap and
 * two app instances cannot each spend the full budget.
 */
class SpendLimiter
{
    public const PER_USER_DAILY_USD = 0.25;
    public const SERVICE_DAILY_USD = 25.0;
    public const PER_USER_DAILY_CALLS = 40;

    /** @return array{allowed: bool, reason: ?string} */
    public function check(string $userKey): array
    {
        $today = Carbon::today()->toDateString();

        $serviceSpend = (float) AiUsage::whereDate('day', $today)
            ->where('cached', false)->sum('cost_usd');

        if ($serviceSpend >= self::SERVICE_DAILY_USD) {
            return ['allowed' => false, 'reason' => 'service-daily-spend'];
        }

        $userRows = AiUsage::whereDate('day', $today)
            ->where('user_key', $userKey)->where('cached', false);

        if ((float) (clone $userRows)->sum('cost_usd') >= self::PER_USER_DAILY_USD) {
            return ['allowed' => false, 'reason' => 'user-daily-spend'];
        }

        if ((clone $userRows)->count() >= self::PER_USER_DAILY_CALLS) {
            return ['allowed' => false, 'reason' => 'user-daily-calls'];
        }

        return ['allowed' => true, 'reason' => null];
    }

    public function record(
        string $userKey,
        string $feature,
        string $model,
        int $inputTokens,
        int $outputTokens,
        float $cost,
        bool $cached = false,
    ): void {
        AiUsage::create([
            'day' => Carbon::today()->toDateString(),
            'user_key' => $userKey,
            'feature' => $feature,
            'model' => $model,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'cost_usd' => $cached ? 0 : $cost,
            'cached' => $cached,
        ]);
    }

    public function todayReport(): array
    {
        $today = Carbon::today()->toDateString();
        $rows = AiUsage::whereDate('day', $today)->get();

        return [
            'day' => $today,
            'service_spend_usd' => round((float) $rows->where('cached', false)->sum('cost_usd'), 4),
            'users' => $rows->pluck('user_key')->unique()->count(),
            'calls' => $rows->where('cached', false)->count(),
            'cache_hits' => $rows->where('cached', true)->count(),
            'by_feature' => $rows->groupBy('feature')->map(fn ($g) => [
                'calls' => $g->where('cached', false)->count(),
                'spend_usd' => round((float) $g->where('cached', false)->sum('cost_usd'), 4),
            ]),
        ];
    }
}
