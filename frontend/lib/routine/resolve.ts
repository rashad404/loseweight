import { resolve as resolveFood } from '../food/provider.ts';
import { usdaProvider } from '../food/usda.ts';
import { azerbaijaniProvider } from '../food/azerbaijani.ts';
import type { ParsedRoutine } from '../ai/parse-routine.ts';
import type {
  Confidence, RoutineItem, RoutineMeal, UserRoutine,
} from './models.ts';

/**
 * Turns a parsed routine into a resolved one by looking up nutrition.
 *
 * Deliberately separate from parsing: the parser decides what was said, this
 * decides what it contains, and only verified sources supply a number. An item
 * that resolves to nothing stays in the routine as unmatched so the user can
 * see and fix it, rather than being dropped or guessed at.
 */
const PROVIDERS = [azerbaijaniProvider, usdaProvider];

const UNIT_GRAMS: Record<string, number> = {
  g: 1, gr: 1, gram: 1, grams: 1, kg: 1000,
  ml: 1, l: 1000,
  oz: 28.35,
  slice: 30, slices: 30,
  piece: 60, pieces: 60,
  cup: 200, cups: 200,
  bowl: 300, bowls: 300,
  plate: 350, plates: 350,
  glass: 250, glasses: 250,
  tbsp: 14, tsp: 5,
};

function toGrams(quantity: number | null, unit: string | null): number | null {
  if (quantity === null) return null;
  if (!unit) return null;
  const factor = UNIT_GRAMS[unit.toLowerCase()];
  return factor ? Math.round(quantity * factor) : null;
}

/**
 * Words that join two foods the person eats together.
 *
 * "bread with butter" came back from the model as a single item, and the
 * lookup answered with butter alone, quietly losing the bread from the total.
 * Splitting only counts when every part is a food we can price, so an
 * unsplittable phrase stays whole rather than fragmenting into unmatched rows.
 */
const JOINERS = /\s+(?:with|and|plus|və|ilə|и|с)\s+/iu;

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counter++}`;

/**
 * Break items that name two foods into one item each, but only when both
 * halves resolve. A phrase we cannot price on both sides is left alone.
 */
async function split(
  items: ParsedRoutine['meals'][number]['items'],
  locale?: string,
): Promise<ParsedRoutine['meals'][number]['items']> {
  const out: ParsedRoutine['meals'][number]['items'] = [];

  for (const item of items) {
    const parts = item.text.split(JOINERS).map((s) => s.trim()).filter(Boolean);

    if (parts.length < 2 || parts.length > 3) {
      out.push(item);
      continue;
    }

    const resolved = await Promise.all(
      parts.map((name) => resolveFood(PROVIDERS, { name, locale })),
    );

    if (resolved.every((m) => m[0]?.nutrition)) {
      // An amount is written before the food it belongs to, so "two slices of
      // bread with butter" measures the bread. Carrying it onto every half
      // labelled the butter "slices" too. The rest fall back to their own
      // typical portions.
      out.push(...parts.map((text, idx) => (idx === 0
        ? { ...item, text }
        : { ...item, text, quantity: null, unit: null, household: null })));
    } else {
      out.push(item);
    }
  }

  return out;
}

export async function resolveRoutine(
  parsed: ParsedRoutine,
  opts: { locale?: string } = {},
): Promise<UserRoutine> {
  const meals: RoutineMeal[] = [];

  for (const meal of parsed.meals) {
    const items: RoutineItem[] = [];

    for (const parsedItem of await split(meal.items, opts.locale)) {
      const grams = toGrams(parsedItem.quantity, parsedItem.unit);
      const matches = await resolveFood(PROVIDERS, {
        name: parsedItem.text,
        grams,
        // A count with no unit still means more food. "2 cokes" resolved to one
        // coke because the quantity was dropped for having no unit attached.
        servings: grams === null ? parsedItem.quantity : null,
        locale: opts.locale,
      });

      // A stated weight is reliable; a household measure is a convention; an
      // unstated portion is an assumption. Each earns a different confidence.
      const portionConfidence: Confidence =
        grams !== null ? 'high' : parsedItem.household ? 'medium' : 'low';

      items.push({
        id: nextId('item'),
        rawText: parsedItem.text,
        match: matches[0] ?? null,
        portion: {
          asDescribed: parsedItem.household ?? (parsedItem.quantity
            ? `${parsedItem.quantity}${parsedItem.unit ?? ''}`
            : parsedItem.text),
          grams,
          household: parsedItem.household,
          confidence: portionConfidence,
        },
        nonNegotiable: parsed.nonNegotiables.some((n) =>
          parsedItem.text.toLowerCase().includes(n.toLowerCase()) ||
          n.toLowerCase().includes(parsedItem.text.toLowerCase())),
      });
    }

    if (items.length > 0) {
      meals.push({
        id: nextId('meal'),
        slot: meal.slot,
        whenDescribed: meal.whenDescribed,
        items,
      });
    }
  }

  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    sourceText: null,
    confirmed: false,
    meals,
    nonNegotiables: parsed.nonNegotiables,
    cooking: 'sometimes',
    eatingOut: 'weekly',
    hungriest: 'varies',
    activityDescribed: null,
  };
}

/** Re-resolve a single item after the user renames it or fixes the portion. */
export async function resolveItem(
  name: string,
  grams: number | null,
  locale?: string,
): Promise<RoutineItem['match']> {
  const matches = await resolveFood(PROVIDERS, { name, grams, locale });
  return matches[0] ?? null;
}

/**
 * Items that genuinely need the user to act: nothing was found for them, so
 * they contribute nothing and the total is wrong until fixed.
 *
 * Low confidence is deliberately excluded. A mixed dish or an assumed portion
 * is usable as it stands, and counting it here made the banner read "6 need
 * your attention" when only four were actually broken, which trains people to
 * ignore the warning.
 */
export function itemsNeedingAttention(routine: UserRoutine): RoutineItem[] {
  return routine.meals.flatMap((m) => m.items).filter((i) => !i.match?.nutrition);
}

/** Items that resolved, but with a range wide enough to be worth saying so. */
export function uncertainItems(routine: UserRoutine): RoutineItem[] {
  return routine.meals
    .flatMap((m) => m.items)
    .filter((i) => i.match?.nutrition && i.match.confidence === 'low');
}
