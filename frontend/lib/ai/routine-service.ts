import { createAnthropicProvider } from './anthropic.ts';
import { checkSpend, record, type AiResult } from './provider.ts';
import {
  PARSE_SCHEMA_NAME, PARSE_SYSTEM, parseCacheKey, parseRoutineDeterministic,
  type ParsedRoutine,
} from './parse-routine.ts';
import { screenTopics } from '../safety/boundaries.ts';

/**
 * Parsing service. Server-side only.
 *
 * Order of operations matters: the safety screen runs before any text leaves
 * the process, the cache runs before any spend, and the deterministic parser
 * catches every failure so the user always gets something to correct.
 */
const cache = new Map<string, ParsedRoutine>();
const MAX_CACHE = 500;

export interface ParseOutcome {
  routine: ParsedRoutine;
  source: 'cache' | 'model' | 'fallback';
  /** Set when the request was refused rather than parsed. */
  refusedTopics?: string[];
  costUsd: number;
}

export async function parseRoutine(text: string, userKey: string): Promise<ParseOutcome> {
  // A description of how someone eats should not contain a medical question,
  // but if it does it must not reach a model with a food-parsing prompt.
  const topics = screenTopics(text);
  if (!topics.allowed) {
    return {
      routine: { meals: [], nonNegotiables: [] },
      source: 'fallback',
      refusedTopics: topics.topics,
      costUsd: 0,
    };
  }

  const key = parseCacheKey(text);
  const hit = cache.get(key);
  if (hit) return { routine: hit, source: 'cache', costUsd: 0 };

  const provider = createAnthropicProvider();
  const spend = checkSpend(userKey);

  if (provider.available && spend.allowed) {
    try {
      const result: AiResult<ParsedRoutine> = await provider.complete({
        feature: 'parse-routine',
        schemaName: PARSE_SCHEMA_NAME,
        system: PARSE_SYSTEM,
        user: text,
        maxOutputTokens: 1200,
      });

      const routine = sanitise(result.data);
      if (result.usage) record(userKey, result.usage);
      remember(key, routine);

      return { routine, source: 'model', costUsd: result.usage?.estimatedCost ?? 0 };
    } catch {
      // Any provider failure falls through to the deterministic parser rather
      // than showing the user an error on the first screen of onboarding.
    }
  }

  const routine = parseRoutineDeterministic(text);
  remember(key, routine);
  return { routine, source: 'fallback', costUsd: 0 };
}

function remember(key: string, routine: ParsedRoutine): void {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, routine);
}

/**
 * Never trust the shape a model returns. Anything unrecognised is dropped, and
 * nutrition fields are stripped even if the model invented some.
 */
function sanitise(raw: unknown): ParsedRoutine {
  const slots = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];
  const r = raw as Partial<ParsedRoutine> | null;
  if (!r || !Array.isArray(r.meals)) return { meals: [], nonNegotiables: [] };

  const meals = r.meals
    .filter((m) => m && slots.includes(String(m.slot)))
    .map((m) => ({
      slot: m.slot,
      whenDescribed: typeof m.whenDescribed === 'string' ? m.whenDescribed.slice(0, 60) : null,
      items: (Array.isArray(m.items) ? m.items : [])
        .filter((i) => i && typeof i.text === 'string' && i.text.trim().length > 1)
        .slice(0, 12)
        .map((i) => ({
          text: String(i.text).slice(0, 120),
          quantity: typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? i.quantity : null,
          unit: typeof i.unit === 'string' ? i.unit.slice(0, 20) : null,
          household: typeof i.household === 'string' ? i.household.slice(0, 40) : null,
        })),
    }))
    .filter((m) => m.items.length > 0)
    .slice(0, 8);

  const nonNegotiables = (Array.isArray(r.nonNegotiables) ? r.nonNegotiables : [])
    .filter((s) => typeof s === 'string' && s.trim().length > 1)
    .map((s) => String(s).slice(0, 60))
    .slice(0, 10);

  return { meals, nonNegotiables };
}

export const clearParseCache = () => cache.clear();
