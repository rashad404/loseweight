<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Anthropic client.
 *
 * The key is read from server config and never leaves this class. Callers get
 * structured data or an exception, never a raw response to interpret.
 */
class AnthropicClient
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    /** Per million tokens. */
    private const PRICING = [
        'claude-haiku-4-5-20251001' => ['input' => 1.0, 'output' => 5.0],
    ];

    public function available(): bool
    {
        return filled(config('services.anthropic.key'));
    }

    public function model(): string
    {
        return config('services.anthropic.model') ?: 'claude-haiku-4-5-20251001';
    }

    public function cost(string $model, int $input, int $output): float
    {
        $p = self::PRICING[$model] ?? self::PRICING['claude-haiku-4-5-20251001'];

        return ($input / 1_000_000) * $p['input'] + ($output / 1_000_000) * $p['output'];
    }

    /**
     * Run several structured calls at once.
     *
     * Latency here is output tokens, not network: measured at about 8ms per
     * token, so one reply of 1350 tokens takes 11 seconds whether it comes
     * from our stack or from a raw call. Splitting one large reply into two
     * smaller ones that run together turns that into the longer of the two.
     *
     * Each entry is [system, user, maxTokens]. Results come back under the same
     * keys, and a failed or unusable one is null rather than an exception, so
     * one half failing still leaves the other usable.
     *
     * @param  array<string, array{0: string, 1: string, 2?: int}>  $calls
     * @return array<string, array{data: array, input_tokens: int, output_tokens: int, model: string}|null>
     */
    public function structuredPool(array $calls, string $schemaName): array
    {
        if (! $this->available()) {
            throw new \RuntimeException('no-key');
        }

        $model = $this->model();

        $responses = Http::pool(fn (Pool $pool) => collect($calls)
            ->map(fn (array $c, string $key) => $pool->as($key)
                ->withHeaders([
                    'x-api-key' => config('services.anthropic.key'),
                    'anthropic-version' => '2023-06-01',
                ])
                ->timeout(25)
                ->post(self::ENDPOINT, [
                    'model' => $model,
                    'max_tokens' => $c[2] ?? 1200,
                    'system' => $c[0],
                    'messages' => [[
                        'role' => 'user',
                        'content' => $c[1]."\n\nReturn only JSON matching {$schemaName}. No prose, no code fence.",
                    ]],
                ]))
            ->all());

        $out = [];

        foreach ($calls as $key => $_) {
            $out[$key] = self::readReply($responses[$key] ?? null, $model);
        }

        return $out;
    }

    /** Null rather than an exception: one half failing must not lose the other. */
    private static function readReply(mixed $response, string $model): ?array
    {
        if (! $response instanceof \Illuminate\Http\Client\Response || ! $response->successful()) {
            Log::warning('anthropic pooled call failed');

            return null;
        }

        $body = $response->json();
        $text = collect($body['content'] ?? [])->firstWhere('type', 'text')['text'] ?? '';
        $clean = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($text));
        $data = json_decode($clean, true);

        if (! is_array($data)) {
            Log::warning('anthropic pooled reply was not usable JSON');

            return null;
        }

        return [
            'data' => $data,
            'input_tokens' => (int) ($body['usage']['input_tokens'] ?? 0),
            'output_tokens' => (int) ($body['usage']['output_tokens'] ?? 0),
            'model' => $model,
        ];
    }

    /**
     * @return array{data: array, input_tokens: int, output_tokens: int, model: string}
     *
     * @throws \RuntimeException when the call fails or the reply is not usable JSON.
     */
    public function structured(string $system, string $user, string $schemaName, int $maxTokens = 1200): array
    {
        if (! $this->available()) {
            throw new \RuntimeException('no-key');
        }

        $model = $this->model();

        $response = Http::withHeaders([
            'x-api-key' => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(20)->post(self::ENDPOINT, [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'system' => $system,
            'messages' => [[
                'role' => 'user',
                'content' => $user."\n\nReturn only JSON matching {$schemaName}. No prose, no code fence.",
            ]],
        ]);

        if (! $response->successful()) {
            Log::warning('anthropic call failed', ['status' => $response->status()]);
            throw new \RuntimeException('request-failed');
        }

        $body = $response->json();
        $text = collect($body['content'] ?? [])->firstWhere('type', 'text')['text'] ?? '';
        $clean = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($text));

        $data = json_decode($clean, true);
        if (! is_array($data)) {
            throw new \RuntimeException('bad-json');
        }

        return [
            'data' => $data,
            'input_tokens' => (int) ($body['usage']['input_tokens'] ?? 0),
            'output_tokens' => (int) ($body['usage']['output_tokens'] ?? 0),
            'model' => $model,
        ];
    }
}
