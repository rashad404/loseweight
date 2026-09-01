import type { Confidence, FoodMatch } from '../routine/models.ts';
import { API_URL } from '../api/base.ts';
import { scale, type FoodProvider, type FoodQuery, type Per100g } from './provider.ts';

/**
 * USDA FoodData Central.
 *
 * The remote API needs a key. Until one is configured this falls back to a
 * small embedded table of the foods that actually turn up in the onboarding
 * answers we tested, so the flow works end to end without silently inventing
 * numbers: anything not in the table returns no match rather than a guess.
 */
/**
 * Per 100 g, from FoodData Central SR Legacy and Foundation entries, each
 * looked up by fdcId rather than typed from memory.
 *
 * This table exists because USDA's own search cannot answer a plain word.
 * Searching "rice" returns twenty-five rice crackers and rice cakes before any
 * cooked rice, and "chicken" is led by a meatless substitute. Curating the
 * foods people actually name keeps the common path both instant and correct,
 * and leaves the API for the long tail, where the user is asked to choose.
 *
 * `aliases` are the words people really type. "rice" has to reach cooked white
 * rice; without it the word fell through to the API and came back as crackers.
 */
interface LocalFood {
  fdcId: string;
  label: string;
  per100: Per100g;
  defaultG: number;
  aliases?: string[];
}

const LOCAL: Record<string, LocalFood> = {
  'white bread':      { fdcId: '174924', label: 'Bread, white, commercially prepared', per100: { kcal: 266, proteinG: 8.9,  fiberG: 2.7 }, defaultG: 30,  aliases: ['bread', 'toast', 'slice of bread'] },
  'whole wheat bread':{ fdcId: '172688', label: 'Bread, whole-wheat, commercially prepared', per100: { kcal: 252, proteinG: 12.4, fiberG: 6 }, defaultG: 30,  aliases: ['brown bread', 'wholemeal bread'] },
  'butter':           { fdcId: '173410', label: 'Butter, salted',                     per100: { kcal: 717, proteinG: 0.9,  fiberG: 0   }, defaultG: 10 },
  'olive oil':        { fdcId: '171413', label: 'Oil, olive, salad or cooking',       per100: { kcal: 884, proteinG: 0,    fiberG: 0   }, defaultG: 14,  aliases: ['oil'] },
  'egg':              { fdcId: '173424', label: 'Egg, whole, cooked, hard-boiled',    per100: { kcal: 155, proteinG: 12.6, fiberG: 0   }, defaultG: 50,  aliases: ['eggs', 'boiled egg', 'fried egg', 'omelette', 'omelet'] },
  'chicken':          { fdcId: '171054', label: 'Chicken, meat only, cooked, roasted', per100: { kcal: 190, proteinG: 28.9, fiberG: 0  }, defaultG: 150, aliases: ['chicken breast', 'roast chicken', 'grilled chicken'] },
  'white rice':       { fdcId: '168878', label: 'Rice, white, long-grain, cooked',    per100: { kcal: 130, proteinG: 2.7,  fiberG: 0.4 }, defaultG: 150, aliases: ['rice', 'boiled rice', 'steamed rice'] },
  'potato':           { fdcId: '170114', label: 'Potatoes, boiled, cooked in skin',   per100: { kcal: 87,  proteinG: 1.9,  fiberG: 2   }, defaultG: 150, aliases: ['potatoes', 'boiled potato'] },
  'french fries':     { fdcId: '170698', label: 'Potato, french fried in vegetable oil', per100: { kcal: 312, proteinG: 3.4, fiberG: 3.8 }, defaultG: 120, aliases: ['fries', 'chips'] },
  'pasta':            { fdcId: '169751', label: 'Pasta, cooked',                      per100: { kcal: 157, proteinG: 5.8,  fiberG: 1.8 }, defaultG: 180, aliases: ['spaghetti', 'macaroni', 'noodles'] },
  'pizza':            { fdcId: '173292', label: 'Pizza, cheese topping, regular crust', per100: { kcal: 266, proteinG: 11.4, fiberG: 2.3 }, defaultG: 200 },
  'greek yogurt':     { fdcId: '170894', label: 'Yogurt, Greek, plain, nonfat',       per100: { kcal: 59,  proteinG: 10.2, fiberG: 0   }, defaultG: 170 },
  'yogurt':           { fdcId: '171284', label: 'Yogurt, plain, whole milk',          per100: { kcal: 61,  proteinG: 3.5,  fiberG: 0   }, defaultG: 170, aliases: ['yoghurt'] },
  'milk':             { fdcId: '171265', label: 'Milk, whole, 3.25% milkfat',         per100: { kcal: 61,  proteinG: 3.2,  fiberG: 0   }, defaultG: 240 },
  'oats':             { fdcId: '173904', label: 'Oats, regular and quick, dry',       per100: { kcal: 379, proteinG: 13.2, fiberG: 10.1 }, defaultG: 40, aliases: ['oatmeal', 'porridge'] },
  'orange juice':     { fdcId: '169098', label: 'Orange juice, raw',                  per100: { kcal: 45,  proteinG: 0.7,  fiberG: 0.2 }, defaultG: 250, aliases: ['juice'] },
  'cola':             { fdcId: '174852', label: 'Beverages, carbonated, cola, regular', per100: { kcal: 42, proteinG: 0,   fiberG: 0   }, defaultG: 330, aliases: ['coke', 'cokes', 'pepsi', 'soda', 'fizzy drink'] },
  'coffee':           { fdcId: '171890', label: 'Coffee, brewed',                     per100: { kcal: 1,   proteinG: 0.1,  fiberG: 0   }, defaultG: 240, aliases: ['black coffee', 'americano', 'espresso'] },
  'tea':              { fdcId: '173227', label: 'Tea, black, brewed',                 per100: { kcal: 1,   proteinG: 0,    fiberG: 0   }, defaultG: 240, aliases: ['black tea', 'green tea', 'çay', 'cay', 'чай'] },
  'beer':             { fdcId: '168746', label: 'Beer, regular, all',                 per100: { kcal: 43,  proteinG: 0.5,  fiberG: 0   }, defaultG: 330 },
  'banana':           { fdcId: '173944', label: 'Bananas, raw',                       per100: { kcal: 89,  proteinG: 1.1,  fiberG: 2.6 }, defaultG: 118, aliases: ['bananas'] },
  'apple':            { fdcId: '171688', label: 'Apples, raw, with skin',             per100: { kcal: 52,  proteinG: 0.3,  fiberG: 2.4 }, defaultG: 180, aliases: ['apples'] },
  'tomato':           { fdcId: '170457', label: 'Tomatoes, red, ripe, raw',           per100: { kcal: 18,  proteinG: 0.9,  fiberG: 1.2 }, defaultG: 120, aliases: ['tomatoes'] },
  'cucumber':         { fdcId: '2346406', label: 'Cucumber, with peel, raw',          per100: { kcal: 16,  proteinG: 0.6,  fiberG: 0   }, defaultG: 120, aliases: ['cucumbers'] },
  'lentils':          { fdcId: '175254', label: 'Lentils, cooked, boiled',            per100: { kcal: 114, proteinG: 9,    fiberG: 7.9 }, defaultG: 200 },
  'beef':             { fdcId: '174034', label: 'Beef, ground, 85% lean, cooked',     per100: { kcal: 256, proteinG: 27.7, fiberG: 0   }, defaultG: 150, aliases: ['ground beef', 'mince', 'minced meat', 'steak'] },
  'salmon':           { fdcId: '171999', label: 'Fish, salmon, cooked, dry heat',     per100: { kcal: 231, proteinG: 25.7, fiberG: 0   }, defaultG: 150, aliases: ['fish'] },
  'almonds':          { fdcId: '170567', label: 'Nuts, almonds',                      per100: { kcal: 579, proteinG: 21.2, fiberG: 12.5 }, defaultG: 30, aliases: ['nuts', 'almond'] },
  'chocolate':        { fdcId: '167587', label: 'Candies, milk chocolate',            per100: { kcal: 535, proteinG: 7.7,  fiberG: 3.4 }, defaultG: 40,  aliases: ['milk chocolate', 'chocolate bar'] },
  'cheese':           { fdcId: '173414', label: 'Cheese, cheddar',                    per100: { kcal: 403, proteinG: 22.9, fiberG: 0   }, defaultG: 30 },
  'sugar':            { fdcId: '169655', label: 'Sugars, granulated',                 per100: { kcal: 387, proteinG: 0,    fiberG: 0   }, defaultG: 8 },
  'honey':            { fdcId: '169640', label: 'Honey',                              per100: { kcal: 304, proteinG: 0.3,  fiberG: 0.2 }, defaultG: 21 },
  'soup':             { fdcId: '171543', label: 'Soup, chicken noodle, canned',       per100: { kcal: 48,  proteinG: 2.4,  fiberG: 0.9 }, defaultG: 250 },
  'salad':            { fdcId: '169249', label: 'Lettuce, green leaf, raw',           per100: { kcal: 15,  proteinG: 1.4,  fiberG: 1.3 }, defaultG: 100 },
};

/**
 * Lowercase, and turn punctuation into spaces.
 *
 * Food records and canonical names are written with commas: "white rice,
 * cooked", "black tea, brewed". Whole-word matching needs a space or the end
 * of the string after a term, so a comma blocked every one of them and a
 * composed plov came back as its butter alone.
 */
const normalise = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * A sane multiplier for a stated count. Guards against a parse that reads a
 * year or a price as a quantity and multiplies a portion by it.
 */
const portions = (servings?: number | null) =>
  servings && servings >= 1 && servings <= 12 ? Math.round(servings) : 1;

/** Every key and alias, longest first so "chicken breast" wins over "chicken". */
const KEYS: { term: string; food: LocalFood }[] = Object.entries(LOCAL)
  .flatMap(([key, food]) => [key, ...(food.aliases ?? [])].map((term) => ({ term, food })))
  .sort((a, b) => b.term.length - a.term.length);

/**
 * Whole-word containment only. A loose match here becomes a wrong calorie
 * figure the user never saw us choose, and "as" inside "pasta" is exactly how
 * that happens.
 */
const contains = (needle: string, haystack: string) =>
  new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`).test(haystack);

/** Words that never change which food is meant. */
const FILLER = new Set(['of', 'with', 'and', 'a', 'an', 'the', 'plain', 'fresh', 'some']);

/**
 * Whether a curated entry answers the whole request, not just part of it.
 *
 * The qualifiers are the point. Asked to name the form of a food, the model
 * returns "white brined cheese" for pendir and "sweet tea" for şirin çay, and
 * matching the bare word inside them threw away exactly the part that changes
 * the calories: cheddar at 403 instead of a brined cheese, tea at 2 kcal
 * instead of tea with sugar.
 *
 * So every meaningful word has to be accounted for, either by the term that
 * matched or by the record's own description. Anything left over means this
 * entry is not the food that was asked for, and the search should handle it.
 */
function coversQuery(query: string, term: string, label: string): boolean {
  const words = (s: string) => new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const known = new Set([...words(term), ...words(label)]);

  return [...words(query)].every((w) => FILLER.has(w) || known.has(w));
}

/**
 * The remote lookup is injectable so tests never depend on the network, on the
 * API being up, or on USDA quota. The default is the real proxy.
 */
export type RemoteLookup = (name: string) => Promise<{
  results: { id: string; name: string; per100g: Per100g }[];
  /** Whether the first result clearly answers the query. */
  strong: boolean;
}>;

const defaultRemote: RemoteLookup = async (name) => {
  const res = await fetch(`${API_URL}/food/search?q=${encodeURIComponent(name)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return { results: [], strong: false };
  const json = (await res.json()) as {
    results?: { id: string; name: string; per100g: Per100g }[];
    strong?: boolean;
  };
  return { results: json.results ?? [], strong: json.strong === true };
};

export function createUsdaProvider(remote: RemoteLookup = defaultRemote): FoodProvider {
  return {
    id: 'usda',

    async search({ name, grams, servings, acceptBest }: FoodQuery): Promise<FoodMatch[]> {
      const n = normalise(name);

      const hit = LOCAL[n]
        ?? KEYS.find(({ term, food }) =>
          (term === n || contains(term, n)) && coversQuery(n, term, food.label))?.food;

      if (hit) {
        const g = grams ?? hit.defaultG * portions(servings);
        const confidence: Confidence = grams ? 'high' : 'medium';
        return [{
          id: `usda:${hit.fdcId}`,
          source: 'usda',
          name: hit.label,
          confidence,
          nutrition: scale(hit.per100, g, confidence),
          ...(grams ? {} : { caveat: 'assumedPortion' }),
        }];
      }

      // Anything the curated table does not know goes through the API, which
      // holds the USDA key. Local first because it is instant and free.
      try {
        const { results, strong } = await remote(name);
        if (results.length === 0) return [];

        const g = grams ?? 100 * portions(servings);
        const confidence: Confidence = grams ? 'medium' : 'low';

        const asMatch = (f: { id: string; name: string; per100g: Per100g }): FoodMatch => ({
          id: `usda:${f.id}`,
          source: 'usda',
          name: f.name,
          confidence,
          nutrition: scale(f.per100g, g, confidence),
          ...(grams ? {} : { caveat: 'assumedPortion' }),
        });

        if (strong || acceptBest) return [asMatch(results[0])];

        // No candidate clearly answers the word. USDA's own order is not a
        // tiebreaker: it ranks rice crackers above rice and a meatless product
        // above chicken. Carry the candidates back with no nutrition attached
        // so the user picks, and nothing is counted until they do.
        return [{
          id: `choice:${n}`,
          source: 'usda',
          name,
          confidence: 'low',
          nutrition: null,
          caveat: 'needsChoice',
          alternatives: results.slice(0, 6).map(asMatch),
        }];
      } catch {
        return [];
      }
    },
  };
}

/** Default provider, using the real API proxy. */
export const usdaProvider = createUsdaProvider();

/** Local table only. Used by tests so they never touch the network. */
export const offlineUsdaProvider = createUsdaProvider(async () => ({ results: [], strong: false }));
