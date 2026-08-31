import type { FoodMatch } from '../routine/models.ts';
import { scale, type FoodProvider, type FoodQuery, type Per100g } from './provider.ts';

/**
 * USDA FoodData Central.
 *
 * The remote API needs a key. Until one is configured this falls back to a
 * small embedded table of the foods that actually turn up in the onboarding
 * answers we tested, so the flow works end to end without silently inventing
 * numbers: anything not in the table returns no match rather than a guess.
 */
const API = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/** Per 100 g, from FoodData Central SR Legacy and Foundation entries. */
const LOCAL: Record<string, { fdcId: string; label: string; per100: Per100g; defaultG: number }> = {
  'white bread':      { fdcId: '172686', label: 'Bread, white, commercially prepared', per100: { kcal: 266, proteinG: 9,   fiberG: 2.7 }, defaultG: 30 },
  'whole wheat bread':{ fdcId: '172687', label: 'Bread, whole-wheat',                 per100: { kcal: 247, proteinG: 13,  fiberG: 7   }, defaultG: 30 },
  'butter':           { fdcId: '173410', label: 'Butter, salted',                     per100: { kcal: 717, proteinG: 0.9, fiberG: 0   }, defaultG: 10 },
  'olive oil':        { fdcId: '171413', label: 'Oil, olive, salad or cooking',       per100: { kcal: 884, proteinG: 0,   fiberG: 0   }, defaultG: 14 },
  'egg':              { fdcId: '171287', label: 'Egg, whole, cooked',                 per100: { kcal: 155, proteinG: 13,  fiberG: 0   }, defaultG: 50 },
  'chicken breast':   { fdcId: '171477', label: 'Chicken, breast, cooked, roasted',   per100: { kcal: 165, proteinG: 31,  fiberG: 0   }, defaultG: 150 },
  'white rice':       { fdcId: '169756', label: 'Rice, white, cooked',                per100: { kcal: 130, proteinG: 2.7, fiberG: 0.4 }, defaultG: 150 },
  'potato':           { fdcId: '170093', label: 'Potatoes, boiled',                   per100: { kcal: 87,  proteinG: 2,   fiberG: 1.8 }, defaultG: 150 },
  'pasta':            { fdcId: '168927', label: 'Pasta, cooked',                      per100: { kcal: 158, proteinG: 5.8, fiberG: 1.8 }, defaultG: 180 },
  'greek yogurt':     { fdcId: '170903', label: 'Yogurt, Greek, plain, nonfat',       per100: { kcal: 59,  proteinG: 10,  fiberG: 0   }, defaultG: 170 },
  'milk':             { fdcId: '171265', label: 'Milk, whole, 3.25% fat',             per100: { kcal: 61,  proteinG: 3.2, fiberG: 0   }, defaultG: 240 },
  'orange juice':     { fdcId: '169098', label: 'Orange juice, raw',                  per100: { kcal: 45,  proteinG: 0.7, fiberG: 0.2 }, defaultG: 250 },
  'cola':             { fdcId: '175055', label: 'Carbonated beverage, cola',          per100: { kcal: 42,  proteinG: 0,   fiberG: 0   }, defaultG: 330 },
  'beer':             { fdcId: '168746', label: 'Beer, regular',                      per100: { kcal: 43,  proteinG: 0.5, fiberG: 0   }, defaultG: 330 },
  'banana':           { fdcId: '173944', label: 'Bananas, raw',                       per100: { kcal: 89,  proteinG: 1.1, fiberG: 2.6 }, defaultG: 118 },
  'apple':            { fdcId: '171688', label: 'Apples, raw, with skin',             per100: { kcal: 52,  proteinG: 0.3, fiberG: 2.4 }, defaultG: 180 },
  'lentils':          { fdcId: '172420', label: 'Lentils, cooked',                    per100: { kcal: 116, proteinG: 9,   fiberG: 7.9 }, defaultG: 200 },
  'cheese':           { fdcId: '173410', label: 'Cheese, cheddar',                    per100: { kcal: 403, proteinG: 25,  fiberG: 0   }, defaultG: 30 },
  'sugar':            { fdcId: '169655', label: 'Sugars, granulated',                 per100: { kcal: 387, proteinG: 0,   fiberG: 0   }, defaultG: 8 },
  'salad':            { fdcId: '168430', label: 'Mixed salad greens, raw',            per100: { kcal: 20,  proteinG: 1.8, fiberG: 1.8 }, defaultG: 100 },
};

const normalise = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

export const usdaProvider: FoodProvider = {
  id: 'usda',

  async search({ name, grams }: FoodQuery): Promise<FoodMatch[]> {
    const key = process.env.USDA_API_KEY;
    const n = normalise(name);

    // Exact, then whole-word containment. Deliberately conservative: a loose
    // match here becomes a wrong calorie figure the user never sees us choose.
    const whole = (needle: string, haystack: string) =>
      new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`).test(haystack);

    const hit =
      LOCAL[n] ??
      Object.entries(LOCAL).find(([k]) => whole(k, n) || (k.length >= 5 && n.includes(k)))?.[1];

    if (hit) {
      const g = grams ?? hit.defaultG;
      const confidence = grams ? 'high' : 'medium';
      return [{
        id: `usda:${hit.fdcId}`,
        source: 'usda',
        name: hit.label,
        confidence,
        nutrition: scale(hit.per100, g, confidence),
        ...(grams ? {} : { caveat: 'assumedPortion' }),
      }];
    }

    if (!key) return [];

    try {
      const res = await fetch(`${API}?api_key=${key}&query=${encodeURIComponent(name)}&pageSize=3`, {
        next: { revalidate: 86_400 },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { foods?: RemoteFood[] };
      return (json.foods ?? []).slice(0, 3).map((f) => toMatch(f, grams));
    } catch {
      return [];
    }
  },
};

interface RemoteFood {
  fdcId: number;
  description: string;
  foodNutrients?: { nutrientName: string; value: number }[];
}

function toMatch(food: RemoteFood, grams: number | null | undefined): FoodMatch {
  const find = (needle: string) =>
    food.foodNutrients?.find((n) => n.nutrientName.toLowerCase().includes(needle))?.value ?? 0;

  const per100: Per100g = {
    kcal: find('energy'),
    proteinG: find('protein'),
    fiberG: find('fiber'),
  };
  const g = grams ?? 100;
  const confidence = grams ? 'medium' : 'low';

  return {
    id: `usda:${food.fdcId}`,
    source: 'usda',
    name: food.description,
    confidence,
    nutrition: scale(per100, g, confidence),
    caveat: grams ? undefined : 'assumedPortion',
  };
}
