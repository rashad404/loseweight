import type { Confidence, FoodMatch, FoodSource, Nutrition } from '../routine/models.ts';

/**
 * Nutrition lookup, behind one interface so the source can change without the
 * rest of the product knowing.
 *
 * Every result carries where it came from. A mixed dish resolved from a recipe
 * returns a range wide enough to be honest about what "one bowl of plov" can
 * mean, and says so.
 */
export interface FoodQuery {
  /** Canonical-ish name, already normalised by the caller. */
  name: string;
  grams?: number | null;
  /** Narrows the search when the user's locale suggests a regional dish. */
  locale?: string;
}

export interface FoodProvider {
  readonly id: FoodSource;
  /** Ordered best-first. Empty when nothing matched. */
  search(query: FoodQuery): Promise<FoodMatch[]>;
}

/** Per 100 g. The unit every provider normalises to before scaling. */
export interface Per100g {
  kcal: number;
  proteinG: number;
  fiberG: number;
}

/**
 * Scale a per-100g figure to a portion, widening the range when the portion
 * itself was a guess. A 20% band on an estimated household portion is honest;
 * a single number is not.
 */
export function scale(
  per100: Per100g,
  grams: number,
  portionConfidence: Confidence,
): Nutrition {
  const f = grams / 100;
  const band = portionConfidence === 'high' ? 0 : portionConfidence === 'medium' ? 0.15 : 0.3;

  const range = (v: number) => ({
    low: Math.round(v * f * (1 - band)),
    high: Math.round(v * f * (1 + band)),
  });

  const kcal = range(per100.kcal);
  const protein = range(per100.proteinG);
  const fiber = range(per100.fiberG);

  return {
    kcalLow: kcal.low, kcalHigh: kcal.high,
    proteinLowG: protein.low, proteinHighG: protein.high,
    fiberLowG: fiber.low, fiberHighG: fiber.high,
  };
}

/**
 * Try providers in order and return everything that matched, best first.
 * Nothing is discarded silently: an unmatched food becomes an explicit
 * `unmatched` result so the UI can ask the user rather than guess.
 */
export async function resolve(
  providers: FoodProvider[],
  query: FoodQuery,
): Promise<FoodMatch[]> {
  const all: FoodMatch[] = [];

  for (const provider of providers) {
    try {
      all.push(...(await provider.search(query)));
    } catch {
      // A provider being unavailable must not lose the matches others found.
    }
  }

  if (all.length === 0) {
    return [{
      id: `unmatched:${query.name}`,
      source: 'unmatched',
      name: query.name,
      confidence: 'low',
      nutrition: null,
      caveat: 'notFound',
    }];
  }

  const rank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
  return all.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
}
