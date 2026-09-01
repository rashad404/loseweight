<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ai\AnthropicClient;
use App\Services\Ai\RoutineParser;
use App\Services\Ai\SpendLimiter;
use Illuminate\Http\Request;

class RoutineParseController extends Controller
{
    public function __construct(
        private readonly RoutineParser $parser,
        private readonly SpendLimiter $limiter,
        private readonly AnthropicClient $client,
    ) {}

    /**
     * Parse a description of how someone normally eats.
     *
     * Consent is required before the text is sent anywhere, and the client is
     * responsible for obtaining it. This endpoint refuses without it rather
     * than assuming.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'min:10', 'max:4000'],
            // Anonymous per-browser key. No account exists; this exists only to
            // enforce a per-user rate and spend limit.
            'user_key' => ['required', 'string', 'max:64'],
            'consent' => ['required', 'accepted'],
            // Which cuisine the dish names belong to. A recipe reviewed for one
            // locale is not automatically right for another.
            'locale' => ['sometimes', 'string', 'in:en,az,ru'],
        ]);

        $result = $this->parser->parse($data['text'], $data['user_key'], $data['locale'] ?? 'en');

        return response()->json([
            'routine' => $result['routine'],
            'source' => $result['source'],
            'refused' => $result['refused'],
            'urgent' => $result['urgent'],
        ]);
    }

    /** Whether AI parsing is live, and what it has cost today. Never echoes the key. */
    public function status()
    {
        return response()->json([
            'ai_parsing' => $this->client->available() ? 'live' : 'deterministic-fallback',
            'model' => $this->client->model(),
            'usda_live_lookups' => filled(config('services.usda.key')),
            'limits' => [
                'per_user_daily_usd' => SpendLimiter::PER_USER_DAILY_USD,
                'service_daily_usd' => SpendLimiter::SERVICE_DAILY_USD,
                'per_user_daily_calls' => SpendLimiter::PER_USER_DAILY_CALLS,
            ],
            'today' => $this->limiter->todayReport(),
        ]);
    }
}
