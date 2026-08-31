import {
  DEFAULT_MODEL, estimateCost, type AiFeature, type AiProvider, type AiResult,
} from './provider.ts';

/**
 * Anthropic provider.
 *
 * Reads its key from the server environment only. This module is never imported
 * from client code, and the API route that uses it is the boundary: raw meal
 * text goes to the provider, nothing else does.
 */
const API = 'https://api.anthropic.com/v1/messages';

export function createAnthropicProvider(): AiProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;

  return {
    id: 'anthropic',
    available: Boolean(key),

    async complete<T>({ feature, schemaName, system, user, maxOutputTokens }: {
      feature: AiFeature;
      schemaName: string;
      system: string;
      user: string;
      maxOutputTokens: number;
    }): Promise<AiResult<T>> {
      if (!key) throw new Error('no-key');

      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxOutputTokens,
          system,
          // Structured output: the model is told to return only JSON matching
          // the named shape, and the response is parsed rather than trusted.
          messages: [{
            role: 'user',
            content: `${user}\n\nReturn only JSON matching ${schemaName}. No prose, no code fence.`,
          }],
        }),
      });

      if (!res.ok) throw new Error(`anthropic-${res.status}`);

      const json = (await res.json()) as {
        content: { type: string; text?: string }[];
        usage?: { input_tokens: number; output_tokens: number };
      };

      const text = json.content.find((c) => c.type === 'text')?.text ?? '';
      const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');

      let data: T;
      try {
        data = JSON.parse(cleaned) as T;
      } catch {
        throw new Error('bad-json');
      }

      const inputTokens = json.usage?.input_tokens ?? 0;
      const outputTokens = json.usage?.output_tokens ?? 0;

      return {
        data,
        fallback: false,
        usage: {
          feature, model, inputTokens, outputTokens,
          estimatedCost: estimateCost(model, inputTokens, outputTokens),
          cached: false,
        },
      };
    },
  };
}
