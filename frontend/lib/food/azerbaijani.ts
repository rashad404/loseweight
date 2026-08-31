import type { FoodMatch } from '../routine/models.ts';
import { scale, type FoodProvider, type FoodQuery, type Per100g } from './provider.ts';

/**
 * Curated Azerbaijani foods.
 *
 * Mixed dishes are stored as recipes composed of ingredients rather than as a
 * single calorie figure, because one plate of plov is not one number: the rice
 * to fat to meat ratio varies by household. Each recipe therefore returns a
 * range wide enough to be true, and says which ingredients produced it.
 *
 * Ingredient values are per 100 g from USDA reference entries. Portion ranges
 * reflect what a home serving actually spans, not a restaurant standard.
 */
interface Ingredient { name: string; grams: number; per100: Per100g }
interface Dish {
  aliases: string[];
  label: string;
  /** A typical serving, and the spread a real serving covers. */
  servingG: number;
  servingLowG: number;
  servingHighG: number;
  ingredients: Ingredient[];
}

const RICE: Per100g = { kcal: 130, proteinG: 2.7, fiberG: 0.4 };
const LAMB: Per100g = { kcal: 294, proteinG: 25, fiberG: 0 };
const BEEF: Per100g = { kcal: 250, proteinG: 26, fiberG: 0 };
const CHICKEN: Per100g = { kcal: 165, proteinG: 31, fiberG: 0 };
const BUTTER: Per100g = { kcal: 717, proteinG: 0.9, fiberG: 0 };
const OIL: Per100g = { kcal: 884, proteinG: 0, fiberG: 0 };
const ONION: Per100g = { kcal: 40, proteinG: 1.1, fiberG: 1.7 };
const FLOUR: Per100g = { kcal: 364, proteinG: 10, fiberG: 2.7 };
const YOGURT: Per100g = { kcal: 61, proteinG: 3.5, fiberG: 0 };
const CHICKPEA: Per100g = { kcal: 164, proteinG: 8.9, fiberG: 7.6 };
const POTATO: Per100g = { kcal: 87, proteinG: 2, fiberG: 1.8 };
const TOMATO: Per100g = { kcal: 18, proteinG: 0.9, fiberG: 1.2 };
const CHEESE_WHITE: Per100g = { kcal: 264, proteinG: 14, fiberG: 0 };
const BREAD: Per100g = { kcal: 266, proteinG: 9, fiberG: 2.7 };
const HERBS: Per100g = { kcal: 23, proteinG: 2.9, fiberG: 2 };
const EGG: Per100g = { kcal: 155, proteinG: 13, fiberG: 0 };
const AUBERGINE: Per100g = { kcal: 25, proteinG: 1, fiberG: 3 };

const DISHES: Dish[] = [
  {
    aliases: ['plov', 'plow', 'pilaf', 'aş', 'as', 'pilav'],
    label: 'Plov',
    servingG: 350, servingLowG: 250, servingHighG: 500,
    ingredients: [
      { name: 'rice', grams: 200, per100: RICE },
      { name: 'lamb', grams: 90, per100: LAMB },
      { name: 'butter', grams: 25, per100: BUTTER },
      { name: 'onion', grams: 35, per100: ONION },
    ],
  },
  {
    aliases: ['dolma', 'dolması'],
    label: 'Dolma',
    servingG: 250, servingLowG: 180, servingHighG: 350,
    ingredients: [
      { name: 'minced lamb', grams: 100, per100: LAMB },
      { name: 'rice', grams: 60, per100: RICE },
      { name: 'onion', grams: 40, per100: ONION },
      { name: 'oil', grams: 12, per100: OIL },
    ],
  },
  {
    aliases: ['dushbara', 'düşbərə', 'dusbara'],
    label: 'Dushbara',
    servingG: 300, servingLowG: 220, servingHighG: 400,
    ingredients: [
      { name: 'flour dough', grams: 110, per100: FLOUR },
      { name: 'minced beef', grams: 70, per100: BEEF },
      { name: 'butter', grams: 10, per100: BUTTER },
    ],
  },
  {
    aliases: ['qutab', 'kutab', 'gutab'],
    label: 'Qutab',
    servingG: 180, servingLowG: 120, servingHighG: 260,
    ingredients: [
      { name: 'flour dough', grams: 90, per100: FLOUR },
      { name: 'herbs', grams: 50, per100: HERBS },
      { name: 'butter', grams: 15, per100: BUTTER },
    ],
  },
  {
    aliases: ['piti', 'pity'],
    label: 'Piti',
    servingG: 400, servingLowG: 300, servingHighG: 500,
    ingredients: [
      { name: 'lamb', grams: 120, per100: LAMB },
      { name: 'chickpeas', grams: 80, per100: CHICKPEA },
      { name: 'potato', grams: 100, per100: POTATO },
      { name: 'fat', grams: 15, per100: OIL },
    ],
  },
  {
    aliases: ['kebab', 'kabab', 'lule kebab', 'lülə kabab', 'tike kabab'],
    label: 'Kebab',
    servingG: 200, servingLowG: 150, servingHighG: 300,
    ingredients: [
      { name: 'lamb', grams: 180, per100: LAMB },
      { name: 'onion', grams: 20, per100: ONION },
    ],
  },
  {
    aliases: ['dovga', 'dovğa'],
    label: 'Dovga',
    servingG: 300, servingLowG: 250, servingHighG: 400,
    ingredients: [
      { name: 'yogurt', grams: 220, per100: YOGURT },
      { name: 'rice', grams: 30, per100: RICE },
      { name: 'herbs', grams: 40, per100: HERBS },
    ],
  },
  {
    aliases: ['badimjan', 'badımcan', 'ajabsandal', 'acabsandal'],
    label: 'Ajabsandal',
    servingG: 300, servingLowG: 220, servingHighG: 400,
    ingredients: [
      { name: 'aubergine', grams: 150, per100: AUBERGINE },
      { name: 'tomato', grams: 80, per100: TOMATO },
      { name: 'potato', grams: 60, per100: POTATO },
      { name: 'oil', grams: 20, per100: OIL },
    ],
  },
  {
    aliases: ['bozbash', 'bozbaş'],
    label: 'Bozbash',
    servingG: 400, servingLowG: 300, servingHighG: 500,
    ingredients: [
      { name: 'lamb', grams: 110, per100: LAMB },
      { name: 'chickpeas', grams: 70, per100: CHICKPEA },
      { name: 'potato', grams: 90, per100: POTATO },
    ],
  },
  {
    aliases: ['chigirtma', 'çığırtma'],
    label: 'Chigirtma',
    servingG: 280, servingLowG: 200, servingHighG: 360,
    ingredients: [
      { name: 'chicken', grams: 140, per100: CHICKEN },
      { name: 'egg', grams: 60, per100: EGG },
      { name: 'oil', grams: 18, per100: OIL },
      { name: 'onion', grams: 40, per100: ONION },
    ],
  },
  {
    aliases: ['pendir', 'white cheese', 'ag pendir'],
    label: 'White cheese',
    servingG: 40, servingLowG: 25, servingHighG: 60,
    ingredients: [{ name: 'white cheese', grams: 40, per100: CHEESE_WHITE }],
  },
  {
    aliases: ['tandir', 'təndir', 'lavash', 'lavaş', 'çörək', 'corek'],
    label: 'Bread',
    servingG: 60, servingLowG: 35, servingHighG: 100,
    ingredients: [{ name: 'bread', grams: 60, per100: BREAD }],
  },
];

const normalise = (s: string) =>
  s.toLowerCase().trim()
    .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/\s+/g, ' ');

function compose(dish: Dish, grams: number | null | undefined): FoodMatch {
  const per100 = dish.ingredients.reduce(
    (acc, ing) => {
      const f = ing.grams / dish.servingG;
      return {
        kcal: acc.kcal + ing.per100.kcal * f,
        proteinG: acc.proteinG + ing.per100.proteinG * f,
        fiberG: acc.fiberG + ing.per100.fiberG * f,
      };
    },
    { kcal: 0, proteinG: 0, fiberG: 0 },
  );

  // A recipe is never high confidence: the ratios vary by household. When the
  // user did not give grams, widen to the real spread of a home serving.
  const g = grams ?? dish.servingG;
  const nutrition = scale(per100, g, 'low');

  if (!grams) {
    const lowScale = dish.servingLowG / dish.servingG;
    const highScale = dish.servingHighG / dish.servingG;
    nutrition.kcalLow = Math.round(per100.kcal * (dish.servingG / 100) * lowScale);
    nutrition.kcalHigh = Math.round(per100.kcal * (dish.servingG / 100) * highScale);
  }

  return {
    id: `curated-az:${dish.label.toLowerCase()}`,
    source: 'recipe',
    name: dish.label,
    confidence: 'low',
    components: dish.ingredients.map((i) => ({ name: i.name, grams: i.grams, source: 'usda' as const })),
    nutrition,
    caveat: 'mixedDish',
  };
}

/**
 * Whole-word matching, with substring matching only for aliases long enough
 * that a coincidental match is unlikely.
 *
 * Naive containment silently mis-attributed foods: the alias "aş" normalises to
 * "as", which is a substring of both "bozbash" and "lavash", so both resolved
 * to Plov. A wrong dish here becomes a wrong calorie figure the user never sees
 * us choose, which is worse than no match at all.
 */
const SUBSTRING_MIN = 5;

function matches(needle: string, haystack: string): boolean {
  if (needle === haystack) return true;
  // Whole-word match, so "as" never matches inside "bozbash".
  if (new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`).test(haystack)) return true;
  if (needle.length >= SUBSTRING_MIN && haystack.includes(needle)) return true;
  return false;
}

export const azerbaijaniProvider: FoodProvider = {
  id: 'curated-az',

  async search({ name, grams }: FoodQuery): Promise<FoodMatch[]> {
    const n = normalise(name);
    const dish = DISHES.find((d) => d.aliases.some((a) => matches(normalise(a), n)));
    return dish ? [compose(dish, grams)] : [];
  },
};

export const AZ_DISH_COUNT = DISHES.length;
