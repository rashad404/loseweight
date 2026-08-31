import { API_URL } from '../api/client.ts';
import { screenTopics } from '../safety/boundaries.ts';
import { parseRoutineDeterministic, type ParsedRoutine } from './parse-routine.ts';

/**
 * Client side of routine parsing.
 *
 * The AI key, the durable cache, and the spend ledger all live in the Laravel
 * API. This module only decides whether to ask it, and always has a working
 * answer if it cannot.
 *
 * The deterministic parser runs here rather than on the server because it needs
 * no secret, costs nothing, and returns instantly. That makes it a genuine
 * fallback rather than a second network round trip.
 */
export type ParseSource = 'model' | 'cache' | 'local' | 'refused';

export interface ParseOutcome {
  routine: ParsedRoutine;
  source: ParseSource;
  /** Populated when the text was refused rather than parsed. */
  refusedTopics: string[];
  urgent: boolean;
}

/** Anonymous per-browser key. Enforces a rate limit without needing an account. */
export function userKey(): string {
  const KEY = 'lw_user_key';
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return 'anonymous';
  }
}

export async function parseRoutine(
  text: string,
  opts: { consent: boolean; signal?: AbortSignal },
): Promise<ParseOutcome> {
  // Screened here for an immediate answer. The server screens again, and that
  // one is authoritative.
  const screen = screenTopics(text);
  if (!screen.allowed) {
    return { routine: { meals: [], nonNegotiables: [] }, source: 'refused', refusedTopics: screen.topics, urgent: screen.urgent };
  }

  const local = parseRoutineDeterministic(text);

  // Without consent the text never leaves the browser.
  if (!opts.consent) {
    return { routine: local, source: 'local', refusedTopics: [], urgent: false };
  }

  try {
    const res = await fetch(`${API_URL}/routine/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ text, user_key: userKey(), consent: true }),
      signal: opts.signal,
    });

    if (!res.ok) return { routine: local, source: 'local', refusedTopics: [], urgent: false };

    const json = (await res.json()) as {
      routine: ParsedRoutine;
      source: string;
      refused: string[];
      urgent: boolean;
    };

    if (json.source === 'refused') {
      return { routine: { meals: [], nonNegotiables: [] }, source: 'refused', refusedTopics: json.refused, urgent: json.urgent };
    }

    // An empty result from the server is worse than the local parse, so keep
    // whichever actually found meals.
    const usable = json.routine?.meals?.length ? json.routine : local;
    const source: ParseSource = json.source === 'cache' ? 'cache' : json.routine?.meals?.length ? 'model' : 'local';

    return { routine: usable, source, refusedTopics: [], urgent: false };
  } catch {
    return { routine: local, source: 'local', refusedTopics: [], urgent: false };
  }
}
