/**
 * AI provider boundary.
 *
 * What AI is allowed to do here: read the user's own words and propose a
 * structure. What it is never allowed to do: produce a nutrition figure, a
 * calorie target, a safety threshold, or a decision. Those come from the food
 * providers and the rules library, and are resolved after parsing.
 *
 * Everything is behind this interface so the model can change, and so the whole
 * flow runs deterministically when no key is configured.
 */

export type AiFeature = 'parse-routine' | 'explain-change' | 'answer-situation';

export interface AiUsage {
  feature: AiFeature;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Estimated, in USD. Recorded per call so cost can be attributed by feature. */
  estimatedCost: number;
  cached: boolean;
}

export interface AiResult<T> {
  data: T;
  usage: AiUsage | null;
  /** True when the deterministic fallback produced this, not a model. */
  fallback: boolean;
}

export interface AiProvider {
  readonly id: string;
  readonly available: boolean;
  /**
   * Structured output only. `schemaName` identifies the expected shape so the
   * provider can request a constrained response rather than free prose.
   */
  complete<T>(args: {
    feature: AiFeature;
    schemaName: string;
    system: string;
    user: string;
    maxOutputTokens: number;
  }): Promise<AiResult<T>>;
}

/* ------------------------------------------------------------ cost model -- */

/**
 * Per million tokens. A small, cheap model is used for parsing and routine
 * responses, which is where nearly all the volume is.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
};

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL];
  return (inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output;
}

/* ------------------------------------------------------------ spend caps -- */

export const SPEND_LIMITS = {
  /** Per user per day, in USD. */
  perUserDaily: 0.25,
  /** Whole service per day, in USD. A hard stop, not a warning. */
  serviceDaily: 25,
  /** Calls per user per day, whatever they cost. */
  perUserDailyCalls: 40,
} as const;

interface Ledger {
  day: string;
  serviceSpend: number;
  users: Record<string, { spend: number; calls: number }>;
  byFeature: Record<string, { calls: number; spend: number }>;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * In-memory ledger. Adequate for a single server process; it resets on restart,
 * which is a known limitation recorded rather than hidden. A shared store is
 * required before this runs on more than one instance.
 */
let ledger: Ledger = { day: today(), serviceSpend: 0, users: {}, byFeature: {} };

function roll(): void {
  if (ledger.day !== today()) {
    ledger = { day: today(), serviceSpend: 0, users: {}, byFeature: {} };
  }
}

export type SpendDecision =
  | { allowed: true }
  | { allowed: false; reason: 'user-daily-spend' | 'user-daily-calls' | 'service-daily-spend' };

export function checkSpend(userKey: string): SpendDecision {
  roll();
  if (ledger.serviceSpend >= SPEND_LIMITS.serviceDaily) {
    return { allowed: false, reason: 'service-daily-spend' };
  }
  const u = ledger.users[userKey];
  if (u) {
    if (u.spend >= SPEND_LIMITS.perUserDaily) return { allowed: false, reason: 'user-daily-spend' };
    if (u.calls >= SPEND_LIMITS.perUserDailyCalls) return { allowed: false, reason: 'user-daily-calls' };
  }
  return { allowed: true };
}

export function record(userKey: string, usage: AiUsage): void {
  roll();
  if (usage.cached) return;

  ledger.serviceSpend += usage.estimatedCost;
  const u = (ledger.users[userKey] ??= { spend: 0, calls: 0 });
  u.spend += usage.estimatedCost;
  u.calls += 1;

  const f = (ledger.byFeature[usage.feature] ??= { calls: 0, spend: 0 });
  f.calls += 1;
  f.spend += usage.estimatedCost;
}

export const usageReport = () => {
  roll();
  return {
    day: ledger.day,
    serviceSpend: Math.round(ledger.serviceSpend * 10000) / 10000,
    users: Object.keys(ledger.users).length,
    byFeature: ledger.byFeature,
  };
};

/** Test seam. */
export function resetLedger(): void {
  ledger = { day: today(), serviceSpend: 0, users: {}, byFeature: {} };
}
