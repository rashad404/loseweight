import { SAFETY_LIMITS } from '../safety/boundaries.ts';
import { KCAL_PER_KG } from '../health/calculations.ts';
import type {
  ChangeKind, Difficulty, RoutineItem, RoutineMeal, UserRoutine,
} from './models.ts';

/**
 * The deterministic change-selection library.
 *
 * Rules propose candidates and the selector ranks and filters them. AI never
 * runs here: it may later rewrite a candidate's wording, but the decision, the
 * numbers, and the ordering are made in this file and are reproducible from the
 * routine alone.
 *
 * Ordering reflects a deliberate hierarchy, cheapest behavioural cost first:
 * cut cooking fat before staple foods, change a portion before banning a food,
 * and never take away something the user said they will not give up.
 */

export interface RuleContext {
  routine: UserRoutine;
  /** Estimated current daily intake, midpoint of the routine range. */
  currentKcal: number;
  /** Target intake from the deterministic planner. */
  targetKcal: number;
  maintenanceKcal: number;
  proteinTargetG: number;
  fiberTargetG: number;
  currentProteinG: number;
  currentFiberG: number;
}

export interface ChangeCandidate {
  id: string;
  ruleId: string;
  kind: ChangeKind;
  targetMealId: string | null;
  targetItemId: string | null;
  /** Message key plus params, so the deterministic path needs no AI to render. */
  titleKey: string;
  rationaleKey: string;
  params: Record<string, string | number>;
  difficulty: Difficulty;
  kcalSavedLow: number;
  kcalSavedHigh: number;
  proteinAddedG: number;
  fiberAddedG: number;
  alternativeKeys: string[];
  /** Lower sorts first. Encodes the behavioural-cost hierarchy. */
  priority: number;
}

const mid = (low: number, high: number) => Math.round((low + high) / 2);

/**
 * Food-word matching across three alphabets.
 *
 * JavaScript's \b is defined against [A-Za-z0-9_], so it never matches beside
 * a Cyrillic letter or an "ə". Written as \bмасло\b and \byağ\b, every
 * Azerbaijani and Russian term in these two lists was dead, and the cooking-fat
 * and liquid-calorie rules only ever fired in English.
 *
 * Azerbaijani and Russian also take case endings, so "yağ" appears as "yağı"
 * and "şirə" as "şirəsi". Those stems match a word start with any ending after
 * it. English terms stay whole-word, so "soda" cannot match "sodium".
 */
const L = String.raw`\p{L}\p{N}`;

/** Whole word, in any alphabet. */
const whole = (terms: string[]) =>
  new RegExp(String.raw`(?<![${L}])(?:${terms.join('|')})(?![${L}])`, 'iu');

/** Word start, any ending. For languages that suffix the noun. */
const stem = (terms: string[]) =>
  new RegExp(String.raw`(?<![${L}])(?:${terms.join('|')})`, 'iu');

const FAT_EN = whole(['oil', 'butter', 'ghee', 'margarine']);
const FAT_STEM = stem(['yağ', 'kərə', 'масл', 'маргарин']);
const LIQUID_EN = whole(['juice', 'cola', 'soda', 'beer', 'wine', 'latte', 'smoothie']);
const LIQUID_STEM = stem(['şirə', 'pivə', 'пив', 'сок', 'кола', 'лимонад']);

const FAT_WORDS = { test: (s: string) => FAT_EN.test(s) || FAT_STEM.test(s) };
const LIQUID_KCAL_WORDS = { test: (s: string) => LIQUID_EN.test(s) || LIQUID_STEM.test(s) };

function itemKcal(item: RoutineItem): number {
  if (!item.match?.nutrition) return 0;
  return mid(item.match.nutrition.kcalLow, item.match.nutrition.kcalHigh);
}

function allItems(routine: UserRoutine): { meal: RoutineMeal; item: RoutineItem }[] {
  return routine.meals.flatMap((meal) => meal.items.map((item) => ({ meal, item })));
}

/* ----------------------------------------------------------------- rules -- */

type Rule = (ctx: RuleContext) => ChangeCandidate[];

/**
 * Cooking fat first. It is calorie dense, invisible in the finished dish, and
 * halving it changes the meal less than removing anything else would.
 */
const reduceCookingFat: Rule = (ctx) => {
  const out: ChangeCandidate[] = [];

  for (const { meal, item } of allItems(ctx.routine)) {
    const kcal = itemKcal(item);
    if (kcal < 60) continue;
    if (!FAT_WORDS.test(item.rawText) && !FAT_WORDS.test(item.match?.name ?? '')) continue;

    const saved = Math.round(kcal * 0.5);
    out.push({
      id: `fat:${item.id}`,
      ruleId: 'reduce-cooking-fat',
      kind: 'reduce-cooking-fat',
      targetMealId: meal.id,
      targetItemId: item.id,
      titleKey: 'change.fat.title',
      rationaleKey: 'change.fat.rationale',
      params: { food: item.match?.name ?? item.rawText, saved },
      difficulty: 'easy',
      kcalSavedLow: Math.round(saved * 0.7),
      kcalSavedHigh: Math.round(saved * 1.1),
      proteinAddedG: 0,
      fiberAddedG: 0,
      alternativeKeys: ['change.fat.alt.spray', 'change.fat.alt.measure', 'change.fat.alt.nonstick'],
      priority: 1,
    });
  }

  return out;
};

/**
 * Liquid calories are the next cheapest cut: they carry almost no satiety, so
 * removing them costs less fullness than removing the same calories as food.
 * Never proposed for something the user marked non-negotiable.
 */
const swapLiquidCalories: Rule = (ctx) => {
  const out: ChangeCandidate[] = [];

  for (const { meal, item } of allItems(ctx.routine)) {
    if (item.nonNegotiable) continue;
    const kcal = itemKcal(item);
    if (kcal < 80) continue;

    const isDrink = meal.slot === 'drink' || LIQUID_KCAL_WORDS.test(item.rawText);
    if (!isDrink) continue;

    out.push({
      id: `liquid:${item.id}`,
      ruleId: 'swap-liquid-calories',
      kind: 'swap-liquid-calories',
      targetMealId: meal.id,
      targetItemId: item.id,
      titleKey: 'change.liquid.title',
      rationaleKey: 'change.liquid.rationale',
      params: { food: item.match?.name ?? item.rawText, saved: kcal },
      difficulty: 'moderate',
      kcalSavedLow: Math.round(kcal * 0.8),
      kcalSavedHigh: kcal,
      proteinAddedG: 0,
      fiberAddedG: 0,
      alternativeKeys: ['change.liquid.alt.sparkling', 'change.liquid.alt.half', 'change.liquid.alt.smaller'],
      priority: 2,
    });
  }

  return out;
};

/**
 * Protein and fibre are added, not removed, so they raise satiety without the
 * plan feeling like a restriction. Proposed only when the routine genuinely
 * falls short of target.
 */
const addProtein: Rule = (ctx) => {
  const shortfall = ctx.proteinTargetG - ctx.currentProteinG;
  if (shortfall < 15) return [];

  const target = ctx.routine.meals
    .filter((m) => m.slot !== 'drink')
    .map((m) => ({
      meal: m,
      protein: m.items.reduce((s, i) => s + (i.match?.nutrition ? mid(i.match.nutrition.proteinLowG, i.match.nutrition.proteinHighG) : 0), 0),
    }))
    .sort((a, b) => a.protein - b.protein)[0];

  if (!target) return [];

  return [{
    id: `protein:${target.meal.id}`,
    ruleId: 'add-protein',
    kind: 'add-protein',
    targetMealId: target.meal.id,
    targetItemId: null,
    titleKey: 'change.protein.title',
    rationaleKey: 'change.protein.rationale',
    params: { meal: target.meal.slot, grams: Math.min(Math.round(shortfall), 40) },
    difficulty: 'easy',
    // Adding protein costs calories; it buys satiety rather than a deficit.
    kcalSavedLow: 0,
    kcalSavedHigh: 0,
    proteinAddedG: Math.min(Math.round(shortfall), 40),
    fiberAddedG: 0,
    alternativeKeys: ['change.protein.alt.yogurt', 'change.protein.alt.eggs', 'change.protein.alt.legumes'],
    priority: 2,
  }];
};

const addFiber: Rule = (ctx) => {
  const shortfall = ctx.fiberTargetG - ctx.currentFiberG;
  if (shortfall < 6) return [];

  return [{
    id: 'fiber:routine',
    ruleId: 'add-fiber',
    kind: 'add-fiber',
    targetMealId: null,
    targetItemId: null,
    titleKey: 'change.fiber.title',
    rationaleKey: 'change.fiber.rationale',
    params: { grams: Math.min(Math.round(shortfall), 15) },
    difficulty: 'easy',
    kcalSavedLow: 0,
    kcalSavedHigh: 0,
    proteinAddedG: 0,
    fiberAddedG: Math.min(Math.round(shortfall), 15),
    alternativeKeys: ['change.fiber.alt.beans', 'change.fiber.alt.veg', 'change.fiber.alt.wholegrain'],
    priority: 3,
  }];
};

/**
 * Portion reduction, never prohibition, and never on a non-negotiable food.
 * Targets the largest single contributor so one change does the most work.
 */
const adjustPortion: Rule = (ctx) => {
  const ranked = allItems(ctx.routine)
    .filter(({ item }) => !item.nonNegotiable && itemKcal(item) >= 200)
    .sort((a, b) => itemKcal(b.item) - itemKcal(a.item));

  const top = ranked[0];
  if (!top) return [];

  const kcal = itemKcal(top.item);
  const saved = Math.round(kcal * 0.25);

  return [{
    id: `portion:${top.item.id}`,
    ruleId: 'adjust-portion',
    kind: 'adjust-portion',
    targetMealId: top.meal.id,
    targetItemId: top.item.id,
    titleKey: 'change.portion.title',
    rationaleKey: 'change.portion.rationale',
    params: { food: top.item.match?.name ?? top.item.rawText, saved, percent: 25 },
    difficulty: 'moderate',
    kcalSavedLow: Math.round(saved * 0.7),
    kcalSavedHigh: Math.round(saved * 1.15),
    proteinAddedG: 0,
    fiberAddedG: 0,
    alternativeKeys: ['change.portion.alt.smallerplate', 'change.portion.alt.serveless', 'change.portion.alt.halfnow'],
    priority: 4,
  }];
};

/**
 * A planned snack before the hungriest window prevents the unplanned eating
 * that usually costs more than the snack does.
 */
const addPlannedSnack: Rule = (ctx) => {
  if (ctx.routine.hungriest === 'varies') return [];
  const hasSnack = ctx.routine.meals.some((m) => m.slot === 'snack');
  if (hasSnack) return [];

  return [{
    id: `snack:${ctx.routine.hungriest}`,
    ruleId: 'add-planned-snack',
    kind: 'add-planned-snack',
    targetMealId: null,
    targetItemId: null,
    titleKey: 'change.snack.title',
    rationaleKey: 'change.snack.rationale',
    params: { when: ctx.routine.hungriest },
    difficulty: 'easy',
    kcalSavedLow: 0,
    kcalSavedHigh: 0,
    proteinAddedG: 12,
    fiberAddedG: 3,
    alternativeKeys: ['change.snack.alt.yogurt', 'change.snack.alt.fruitnuts', 'change.snack.alt.cottage'],
    priority: 3,
  }];
};

/** Cooking rarely and eating out often is a structural problem, not a portion one. */
const simplifyCooking: Rule = (ctx) => {
  const rarely = ctx.routine.cooking === 'rarely';
  const outOften = ctx.routine.eatingOut === 'several-weekly' || ctx.routine.eatingOut === 'most-days';
  if (!rarely || !outOften) return [];

  return [{
    id: 'cooking:simplify',
    ruleId: 'simplify-cooking',
    kind: 'simplify-cooking',
    targetMealId: null,
    targetItemId: null,
    titleKey: 'change.cooking.title',
    rationaleKey: 'change.cooking.rationale',
    params: {},
    difficulty: 'moderate',
    kcalSavedLow: 100,
    kcalSavedHigh: 250,
    proteinAddedG: 10,
    fiberAddedG: 3,
    alternativeKeys: ['change.cooking.alt.batch', 'change.cooking.alt.assembly', 'change.cooking.alt.repeat'],
    priority: 5,
  }];
};

export const RULES: { id: string; run: Rule }[] = [
  { id: 'reduce-cooking-fat', run: reduceCookingFat },
  { id: 'swap-liquid-calories', run: swapLiquidCalories },
  { id: 'add-protein', run: addProtein },
  { id: 'add-fiber', run: addFiber },
  { id: 'add-planned-snack', run: addPlannedSnack },
  { id: 'adjust-portion', run: adjustPortion },
  { id: 'simplify-cooking', run: simplifyCooking },
];

/* -------------------------------------------------------------- selection -- */

export interface Selection {
  chosen: ChangeCandidate[];
  /** Everything the rules proposed, for the "replace this change" UI. */
  rejected: ChangeCandidate[];
  estimatedDailySavingLow: number;
  estimatedDailySavingHigh: number;
  expectedLossLowKg: number;
  expectedLossHighKg: number;
  /** True when the changes alone cannot reach the target intake. */
  shortOfTarget: boolean;
}

const DIFFICULTY_COST: Record<Difficulty, number> = { easy: 1, moderate: 2, hard: 3 };

/**
 * Pick at most three changes.
 *
 * Ranking is by rule priority first, then by calories saved per unit of
 * behavioural difficulty, so a cheap change that saves a little outranks a hard
 * change that saves slightly more. At most one non-easy change is included: the
 * plan says not to ask for several difficult things at once, and stacking them
 * is how a first week gets abandoned.
 */
export function selectChanges(ctx: RuleContext): Selection {
  const candidates = RULES.flatMap((r) => r.run(ctx));
  const neededSaving = Math.max(0, ctx.currentKcal - ctx.targetKcal);

  const score = (c: ChangeCandidate) =>
    mid(c.kcalSavedLow, c.kcalSavedHigh) / DIFFICULTY_COST[c.difficulty];

  const byPriorityThenValue = (a: ChangeCandidate, b: ChangeCandidate) =>
    a.priority !== b.priority ? a.priority - b.priority : score(b) - score(a);

  // Changes that create a deficit and changes that support adherence are ranked
  // separately. Ranking them together let three satiety changes fill every slot
  // and produce a plan that saved nothing: correct by every individual rule, and
  // useless as a whole.
  const deficit = candidates.filter((c) => c.kcalSavedHigh > 0).sort(byPriorityThenValue);
  const support = candidates.filter((c) => c.kcalSavedHigh === 0).sort(byPriorityThenValue);

  const chosen: ChangeCandidate[] = [];
  const usedRules = new Set<string>();
  let hardish = 0;
  let running = 0;

  const take = (c: ChangeCandidate): boolean => {
    if (chosen.length >= SAFETY_LIMITS.maxSimultaneousChanges) return false;
    // One change per rule, so three changes are three different kinds of action
    // rather than the same instruction repeated against different foods.
    if (usedRules.has(c.ruleId)) return false;
    if (c.difficulty !== 'easy' && hardish >= 1) return false;

    chosen.push(c);
    usedRules.add(c.ruleId);
    if (c.difficulty !== 'easy') hardish++;
    running += mid(c.kcalSavedLow, c.kcalSavedHigh);
    return true;
  };

  // Reserve room for adherence support, but never at the cost of the deficit
  // the plan actually needs.
  const deficitSlots = neededSaving > 0
    ? Math.min(SAFETY_LIMITS.maxSimultaneousChanges, 2)
    : 0;

  for (const c of deficit) {
    if (chosen.length >= deficitSlots) break;
    if (running >= neededSaving && chosen.length > 0) break;
    take(c);
  }

  for (const c of support) {
    if (chosen.length >= SAFETY_LIMITS.maxSimultaneousChanges) break;
    take(c);
  }

  // Any slot still free goes back to deficit changes, provided the target is
  // not already met. Overshooting the deficit is a safety issue, not a bonus.
  for (const c of deficit) {
    if (chosen.length >= SAFETY_LIMITS.maxSimultaneousChanges) break;
    if (running >= neededSaving) break;
    take(c);
  }

  const rejected = candidates.filter((c) => !chosen.includes(c));
  const low = chosen.reduce((s, c) => s + c.kcalSavedLow, 0);
  const high = chosen.reduce((s, c) => s + c.kcalSavedHigh, 0);

  return {
    chosen,
    rejected,
    estimatedDailySavingLow: low,
    estimatedDailySavingHigh: high,
    expectedLossLowKg: Math.round(((low * 7) / KCAL_PER_KG) * 100) / 100,
    expectedLossHighKg: Math.round(((high * 7) / KCAL_PER_KG) * 100) / 100,
    shortOfTarget: high < neededSaving * 0.6,
  };
}
