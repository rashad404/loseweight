<?php

namespace App\Services\Ai;

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
