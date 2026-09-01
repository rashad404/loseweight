/**
 * The structured shapes behind the adaptive plan.
 *
 * These are deliberately explicit about uncertainty. A mixed dish described in
 * one sentence cannot be resolved to an exact calorie value, and pretending
 * otherwise is the failure mode this whole model is designed to avoid. Every
 * nutrition estimate carries a range, a confidence, and its provenance.
 */

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

export type Confidence = 'high' | 'medium' | 'low';

/** Where a nutrition estimate came from. Never inferred, always recorded. */
export type FoodSource =
  | 'usda'          // USDA FoodData Central
  | 'curated-az'    // hand-checked Azerbaijani dataset
  | 'recipe'        // composed from ingredients
  | 'user'          // the user corrected or created it
  | 'unmatched';    // recognised as food, no nutrition data found

export interface Nutrition {
  /** Inclusive range. For a high-confidence single food, low and high converge. */
  kcalLow: number;
  kcalHigh: number;
  proteinLowG: number;
  proteinHighG: number;
  fiberLowG: number;
  fiberHighG: number;
}

export interface FoodMatch {
  /** Stable id within its source, so a match can be re-resolved later. */
  id: string;
  source: FoodSource;
  /** Canonical name from the source, not the user's wording. */
  name: string;
  confidence: Confidence;
  /** Set when the source is `recipe`: the ingredients it was composed from. */
  components?: { name: string; grams: number; source: FoodSource }[];
  nutrition: Nutrition | null;
  /** Shown to the user wherever the estimate is uncertain. */
  caveat?: string;
  /**
   * Candidates offered when no single result clearly answers what the user
   * wrote. Present with `caveat: 'needsChoice'` and a null `nutrition`, so the
   * food counts for nothing until the user picks one.
   */
  alternatives?: FoodMatch[];
  /**
   * Where the figure came from, kept with every estimate. "rice", "rice
   * cooked" and "rice dry" are different records and different arithmetic, so
   * the exact record is recorded rather than the search word.
   */
  record?: { fdcId: string; dataType: string | null; description: string };
  /** Present when this was composed from a dish rather than looked up. */
  recipe?: ResolvedRecipe;
}

/**
 * A dish composition as actually used, with everything needed to judge it.
 *
 * `state` is the whole point: a `generated` composition is a proposal from a
 * model, and the UI must present it as one. Only a person's review makes it
 * authoritative.
 */
export interface ResolvedRecipe {
  id: number | null;
  dish: string;
  state: 'generated' | 'user_confirmed' | 'reviewed' | 'curated_override';
  variant: string | null;
  servingG: number;
  /** What the model had to assume, in its own words. */
  assumptions: string[];
  /** Ingredients no food source could price, so the total understates. */
  missing: string[];
  ingredients: { food: string; gramsLow: number; gramsHigh: number; matched: string | null }[];
}

export interface PortionEstimate {
  /** What the user actually said, preserved verbatim for the correction UI. */
  asDescribed: string;
  grams: number | null;
  /** A household measure when grams are a guess: "1 bowl", "2 slices". */
  household: string | null;
  confidence: Confidence;
}

export interface RoutineItem {
  id: string;
  /** The user's own words. Never overwritten by a match. */
  rawText: string;
  match: FoodMatch | null;
  portion: PortionEstimate;
  /** The user marked this as something they will not give up. */
  nonNegotiable: boolean;
}

export interface RoutineMeal {
  id: string;
  slot: MealSlot;
  /** Free text such as "around 8am" or "after work". Not parsed into a time. */
  whenDescribed: string | null;
  items: RoutineItem[];
}

export type CookingFrequency = 'rarely' | 'sometimes' | 'most-days' | 'daily';
export type EatingOutFrequency = 'rarely' | 'weekly' | 'several-weekly' | 'most-days';
export type HungriestTime = 'morning' | 'afternoon' | 'evening' | 'late-night' | 'varies';

/** The five onboarding answers, after parsing and user correction. */
export interface UserRoutine {
  version: 1;
  capturedAt: string;
  /** The original free text, kept so a re-parse never loses the source. */
  sourceText: string | null;
  /** True once the user has reviewed and confirmed the interpretation. */
  confirmed: boolean;
  meals: RoutineMeal[];
  nonNegotiables: string[];
  cooking: CookingFrequency;
  eatingOut: EatingOutFrequency;
  hungriest: HungriestTime;
  /** Baseline activity in the user's own words, or null if not given. */
  activityDescribed: string | null;
}

/* ------------------------------------------------------------- changes --- */

export type ChangeKind =
  | 'reduce-cooking-fat'
  | 'adjust-portion'
  | 'add-protein'
  | 'add-fiber'
  | 'swap-liquid-calories'
  | 'add-planned-snack'
  | 'swap-item'
  | 'simplify-cooking';

export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface PlanChange {
  id: string;
  kind: ChangeKind;
  /** Which meal and item this acts on, when it targets something specific. */
  targetMealId: string | null;
  targetItemId: string | null;
  /** Message key for the short imperative. Rendered in the reader's language. */
  title: string;
  /**
   * Values the title and rationale need, stored with the change.
   *
   * They are computed once when the rules run, from a routine the user may
   * later edit, so recomputing them elsewhere would risk a different answer.
   * Without them a saved plan renders "Measure the  instead of pouring it".
   */
  params: Record<string, string | number>;
  /** Why this change and not another. Traceable to the rule that chose it. */
  rationale: string;
  /** The rule id that selected it, for auditing an explanation against reality. */
  ruleId: string;
  difficulty: Difficulty;
  /** Estimated daily saving as a range. Never a single number. */
  kcalSavedLow: number;
  kcalSavedHigh: number;
  proteinAddedG: number;
  fiberAddedG: number;
  /** Interchangeable ways to satisfy the same change. */
  alternatives: string[];
  accepted: boolean;
}

/* ---------------------------------------------------------------- plan --- */

export interface MealTemplate {
  slot: MealSlot;
  /** Several interchangeable choices, never one rigid menu. */
  options: string[];
  /** The modification applied to this slot, if any. */
  changeId: string | null;
  note: string | null;
}

export interface WeeklyPlan {
  version: 1;
  /** Maintenance keeps the behavior plan active without judging weight-loss speed. */
  mode?: 'loss' | 'maintenance';
  createdAt: string;
  /** Ties the weekly plan to the calorie plan it was built from. */
  planStartedOn: string;
  weekNumber: number;
  changes: PlanChange[];
  templates: MealTemplate[];
  /** One meal a week deliberately left unconstrained. */
  flexibleMeal: string;
  eatingOutRules: string[];
  hungerRescue: string[];
  /** Expected weekly loss as a range, from the deterministic engine. */
  expectedLossLowKg: number;
  expectedLossHighKg: number;
  /** Total estimated daily deficit from accepted changes, as a range. */
  estimatedDailySavingLow: number;
  estimatedDailySavingHigh: number;
}

/* ------------------------------------------------------------ helpers --- */

export const emptyNutrition = (): Nutrition => ({
  kcalLow: 0, kcalHigh: 0, proteinLowG: 0, proteinHighG: 0, fiberLowG: 0, fiberHighG: 0,
});

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    kcalLow: a.kcalLow + b.kcalLow,
    kcalHigh: a.kcalHigh + b.kcalHigh,
    proteinLowG: a.proteinLowG + b.proteinLowG,
    proteinHighG: a.proteinHighG + b.proteinHighG,
    fiberLowG: a.fiberLowG + b.fiberLowG,
    fiberHighG: a.fiberHighG + b.fiberHighG,
  };
}

/** Total a routine, propagating uncertainty rather than collapsing it. */
export function totalRoutine(routine: UserRoutine): {
  nutrition: Nutrition;
  unmatchedCount: number;
  lowConfidenceCount: number;
} {
  let nutrition = emptyNutrition();
  let unmatchedCount = 0;
  let lowConfidenceCount = 0;

  for (const meal of routine.meals) {
    for (const item of meal.items) {
      if (!item.match || !item.match.nutrition) { unmatchedCount++; continue; }
      if (item.match.confidence === 'low' || item.portion.confidence === 'low') lowConfidenceCount++;
      nutrition = addNutrition(nutrition, item.match.nutrition);
    }
  }

  return { nutrition, unmatchedCount, lowConfidenceCount };
}

/** A routine is only usable for planning once enough of it resolved. */
export function routineIsUsable(routine: UserRoutine): boolean {
  const items = routine.meals.flatMap((m) => m.items);
  if (items.length < 2) return false;
  const matched = items.filter((i) => i.match?.nutrition).length;
  return matched / items.length >= 0.5;
}
