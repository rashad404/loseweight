import type { MealSlot } from '../routine/models.ts';

/**
 * The structure a routine description is parsed into.
 *
 * Deliberately free of nutrition: parsing decides what the user said, never
 * what it contains. Food providers resolve nutrition afterwards, so a parsing
 * mistake can never become an invented calorie figure.
 */
export interface ParsedItem {
  text: string;
  quantity: number | null;
  unit: string | null;
  /** "1 bowl", "2 slices". Preserved for the correction UI. */
  household: string | null;
}

export interface ParsedMeal {
  slot: MealSlot;
  whenDescribed: string | null;
  items: ParsedItem[];
}

export interface ParsedRoutine {
  meals: ParsedMeal[];
  nonNegotiables: string[];
}

export const PARSE_SCHEMA_NAME = 'ParsedRoutine';

export const PARSE_SYSTEM = `You convert a person's description of how they normally eat into structured data.

Rules:
- Return only what the person said. Never add foods they did not mention.
- Never estimate calories, protein, or any nutrition value. That is done elsewhere.
- Keep the person's own wording in "text". Do not translate or rename foods.
- Set quantity and unit only when the person stated them. Otherwise use null.
- Put descriptive amounts such as "a bowl" or "two slices" in "household".
- Slot must be one of: breakfast, lunch, dinner, snack, drink.
- If a time is mentioned, keep it verbatim in whenDescribed. Do not invent times.
- List foods the person says they will not give up in nonNegotiables.`;

/* ---------------------------------------------------- deterministic parse -- */

/**
 * Word boundaries that work outside ASCII.
 *
 * JavaScript's \b is defined against [A-Za-z0-9_], so \bзавтрак\b and \bvə\b
 * never match: Cyrillic and "ə" are not word characters to it. Two of the three
 * languages this product ships in were silently unparseable because of it.
 */
const L = String.raw`\p{L}\p{N}`;
const w = (body: string, flags = 'iu') =>
  new RegExp(String.raw`(?<![${L}])(?:${body})(?![${L}])`, flags);

const SLOT_WORDS: Record<MealSlot, RegExp> = {
  breakfast: w('breakfast|morning|səhər yeməyi|səhərlər|səhər|завтрак|утром'),
  lunch: w('lunch|midday|noon|nahar|günorta|обед|днём'),
  dinner: w('dinner|supper|evening meal|şam yeməyi|şam|axşam|ужин|вечером'),
  snack: w('snack|snacks|between meals|qəlyanaltı|перекус'),
  drink: w('drink|drinks|coffee|tea|juice|soda|cola|beer|wine|içki|çay|напиток|напитки|чай|кофе'),
};

const QUANTITY = /(\d+(?:[.,]\d+)?)\s*(g|gr|gram|grams|kg|ml|l|oz|cup|cups|tbsp|tsp|slice|slices|piece|pieces|bowl|bowls|plate|plates|glass|glasses)?/i;
const HOUSEHOLD = w(String.raw`(?:a|one|two|three|couple of|\d+)\s+(?:bowl|plate|glass|cup|slice|piece|handful)s?`);

const PUNCT_SPLIT = /[,;]|\s+-\s+/;
const WORD_SPLIT = w('and|plus|with|və|ilə|и|с', 'iu');
const NOISE = w('i|usually|normally|have|eat|drink|my|some|a|an|the|around|about|then|for|is|are', 'iu');

/** Phrases that introduce a food the user refuses to give up. */
const KEEP_PHRASE = w(
  String.raw`(?:never|won'?t|will not|can'?t|cannot|not)\s+(?:give|giving)\s+up|must have|imtina etmirəm|не откажусь|не откажусь от`,
  'iu',
);

const TIME_EXPR = /(?:at|around|about)?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;

/** Words that carry no food meaning, wherever they sit in the fragment. */
const TRAILING_NOISE = w('for|in|at|on|of|a|an|the|my|some|usually|normally|is|are|i|pью|пью|edirəm', 'iu');

function cleanItem(raw: string): string {
  let s = raw.trim()
    .replace(TIME_EXPR, ' ')
    .replace(/^[\s:,\-]+/, '')
    .replace(/[.!]+$/, '');

  let before: string;
  do {
    before = s;
    s = s
      .replace(new RegExp(String.raw`^(?:${NOISE.source})\s*`, 'iu'), '')
      .replace(new RegExp(String.raw`\s*(?:${TRAILING_NOISE.source})$`, 'iu'), '')
      .trim();
  } while (s !== before);

  return s;
}

/** A fragment that is only filler is not a food. */
const isFood = (text: string) => text.length > 1 && /[\p{L}]{2,}/u.test(text);

function parseItem(raw: string): ParsedItem | null {
  // Read the household measure before cleaning: stripping the leading "a" from
  // "a bowl of plov" would destroy the very phrase being looked for.
  const household = HOUSEHOLD.exec(raw)?.[0]?.trim() ?? null;

  const text = cleanItem(raw);
  if (!isFood(text)) return null;
  const q = QUANTITY.exec(text);
  const quantity = q ? Number.parseFloat(q[1].replace(',', '.')) : null;
  const unit = q?.[2] ?? null;

  return { text, quantity: Number.isFinite(quantity as number) ? quantity : null, unit, household };
}

/**
 * Deterministic fallback parser.
 *
 * Splits on meal keywords and list separators. It is not as good as a model at
 * messy prose, and it is not meant to be: it exists so the product works with
 * no AI key, so the correction UI can be built and tested without one, and so a
 * provider outage degrades to something usable rather than to nothing.
 */
export function parseRoutineDeterministic(text: string): ParsedRoutine {
  const meals: ParsedMeal[] = [];
  const nonNegotiables: string[] = [];

  // Sentences and newlines both act as boundaries between meals.
  const chunks = text.split(/[\n.]+/).map((c) => c.trim()).filter(Boolean);

  for (const chunk of chunks) {
    if (KEEP_PHRASE.test(chunk)) {
      const after = chunk.replace(new RegExp(String.raw`^.*?(?:${KEEP_PHRASE.source})\s*`, 'iu'), '');
      for (const part of splitItems(after)) {
        const c = cleanItem(part);
        if (c.length > 1) nonNegotiables.push(c);
      }
      continue;
    }

    const slot = (Object.keys(SLOT_WORDS) as MealSlot[]).find((s) => SLOT_WORDS[s].test(chunk));
    if (!slot) continue;

    // Everything after the slot word is the food list.
    const body = chunk.replace(SLOT_WORDS[slot], '').replace(/^[\s:,-]*(is|are|i have|i eat|i drink)?\s*/i, '');
    const items = splitItems(body).map(parseItem).filter((i): i is ParsedItem => i !== null);
    if (items.length === 0) continue;

    const when = /\b(?:at|around|about)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(chunk)?.[0] ?? null;

    const existing = meals.find((m) => m.slot === slot);
    if (existing) existing.items.push(...items);
    else meals.push({ slot, whenDescribed: when, items });
  }

  return { meals, nonNegotiables };
}

/** Cache key for a parsed routine, so the same text is never billed twice. */
function splitItems(text: string): string[] {
  return text
    .split(new RegExp(PUNCT_SPLIT.source, 'g'))
    .flatMap((part) => part.split(new RegExp(WORD_SPLIT.source, 'giu')))
    .filter((p): p is string => Boolean(p && p.trim()));
}

export const parseCacheKey = (text: string) =>
  `parse:${text.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 500)}`;
