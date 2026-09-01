import { KCAL_PER_KG } from '../health/calculations.ts';
import { SAFETY_LIMITS } from '../safety/boundaries.ts';
import { selectChanges, type ChangeCandidate, type RuleContext, type Selection } from './rules.ts';
import { totalRoutine } from './models.ts';
import type {
  MealSlot, MealTemplate, PlanChange, UserRoutine, WeeklyPlan,
} from './models.ts';
import type { SavedPlan } from '../plan/storage.ts';

/**
 * Turns a corrected routine and a saved calorie plan into a first week.
 *
 * Everything here is arithmetic on values the deterministic engine already
 * produced. No AI runs in this file: the changes come from the rule library,
 * the targets come from the planner, and the expected loss is derived from the
 * accepted changes rather than from what we would like to promise.
 */

/** Build the context the rule library needs from what the user already has. */
export function contextFor(routine: UserRoutine, plan: SavedPlan): RuleContext {
  const { nutrition } = totalRoutine(routine);

  // The routine total is a range. Rules need one number to work from, so they
  // get the midpoint, and every figure they produce stays a range because the
  // uncertainty is carried in the saving bands rather than dropped here.
  const mid = (low: number, high: number) => Math.round((low + high) / 2);

  return {
    routine,
    currentKcal: mid(nutrition.kcalLow, nutrition.kcalHigh),
    targetKcal: plan.intake,
    maintenanceKcal: plan.maintenance,
    proteinTargetG: plan.proteinLow,
    fiberTargetG: plan.fiber,
    currentProteinG: mid(nutrition.proteinLowG, nutrition.proteinHighG),
    currentFiberG: mid(nutrition.fiberLowG, nutrition.fiberHighG),
  };
}

/**
 * A rule candidate becomes a change the user can act on.
 *
 * `title` and `rationale` stay as message keys plus params until they are
 * rendered, so the same deterministic decision reads correctly in all three
 * languages without a translation step or an AI call.
 */
export function toChange(c: ChangeCandidate, accepted = true): PlanChange {
  return {
    id: c.id,
    kind: c.kind,
    targetMealId: c.targetMealId,
    targetItemId: c.targetItemId,
    title: c.titleKey,
    params: c.params,
    rationale: c.rationaleKey,
    ruleId: c.ruleId,
    difficulty: c.difficulty,
    kcalSavedLow: c.kcalSavedLow,
    kcalSavedHigh: c.kcalSavedHigh,
    proteinAddedG: c.proteinAddedG,
    fiberAddedG: c.fiberAddedG,
    alternatives: c.alternativeKeys,
    accepted,
  };
}

/** The params a rendered change needs, kept beside it rather than inlined. */
export const changeParams = (c: ChangeCandidate) => c.params;

/**
 * What the accepted changes are actually worth.
 *
 * Recomputed from the accepted set rather than taken from the original
 * selection, because rejecting one change has to change the promise. A plan
 * that still claims the full saving after the user drops a third of it is
 * lying about its own arithmetic.
 */
export function expectedFrom(changes: PlanChange[]): {
  dailyLow: number;
  dailyHigh: number;
  weeklyLossLowKg: number;
  weeklyLossHighKg: number;
} {
  const accepted = changes.filter((c) => c.accepted);
  const dailyLow = accepted.reduce((n, c) => n + c.kcalSavedLow, 0);
  const dailyHigh = accepted.reduce((n, c) => n + c.kcalSavedHigh, 0);

  return {
    dailyLow,
    dailyHigh,
    // Energy balance alone. Real loss varies with water, glycogen and
    // adherence, which is why this is shown as a range and never as a promise.
    weeklyLossLowKg: Math.round(((dailyLow * 7) / KCAL_PER_KG) * 100) / 100,
    weeklyLossHighKg: Math.round(((dailyHigh * 7) / KCAL_PER_KG) * 100) / 100,
  };
}

/**
 * Meal templates: several interchangeable options per slot, never a fixed menu.
 *
 * Options come from what the person already eats. A plan built out of foods
 * they have never mentioned is a diet sheet, and diet sheets get abandoned in
 * the first week.
 */
export function templatesFor(routine: UserRoutine, changes: PlanChange[]): MealTemplate[] {
  const order: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];

  return order
    .map((slot): MealTemplate | null => {
      const meals = routine.meals.filter((m) => m.slot === slot);
      if (meals.length === 0) return null;

      const options = meals
        .flatMap((m) => m.items)
        .filter((i) => i.match?.nutrition)
        .map((i) => i.rawText);

      const change = changes.find(
        (c) => c.accepted && meals.some((m) => m.id === c.targetMealId),
      );

      return options.length === 0 ? null : {
        slot,
        options,
        changeId: change?.id ?? null,
        note: null,
      } satisfies MealTemplate;
    })
    .filter((t): t is MealTemplate => t !== null);
}

/**
 * Rules for eating out and for the hunger that ends most attempts.
 *
 * These are message keys, chosen from what the person told us rather than
 * offered as a generic list. Someone who eats out most days needs a different
 * rule from someone who does it monthly.
 */
export function situationKeys(routine: UserRoutine): {
  eatingOutRules: string[];
  hungerRescue: string[];
  flexibleMeal: string;
} {
  const often = routine.eatingOut === 'most-days' || routine.eatingOut === 'several-weekly';

  return {
    eatingOutRules: often
      ? ['situation.out.often.order', 'situation.out.often.drink', 'situation.out.often.half']
      : ['situation.out.rare.enjoy', 'situation.out.rare.drink', 'situation.out.rare.next'],
    hungerRescue: [
      `situation.hunger.${routine.hungriest}`,
      'situation.hunger.protein',
      'situation.hunger.wait',
    ],
    // One meal a week is deliberately unconstrained. A plan with no room in it
    // is a plan people leave rather than adjust.
    flexibleMeal: 'situation.flexible',
  };
}

export function buildWeeklyPlan(
  routine: UserRoutine,
  plan: SavedPlan,
  changes: PlanChange[],
  weekNumber = 1,
): WeeklyPlan {
  const expected = expectedFrom(changes);
  const situation = situationKeys(routine);

  return {
    version: 1,
    mode: 'loss',
    createdAt: new Date().toISOString(),
    planStartedOn: plan.startedOn,
    weekNumber,
    changes,
    templates: templatesFor(routine, changes),
    flexibleMeal: situation.flexibleMeal,
    eatingOutRules: situation.eatingOutRules,
    hungerRescue: situation.hungerRescue,
    expectedLossLowKg: expected.weeklyLossLowKg,
    expectedLossHighKg: expected.weeklyLossHighKg,
    estimatedDailySavingLow: expected.dailyLow,
    estimatedDailySavingHigh: expected.dailyHigh,
  };
}

/**
 * Everything the review screen needs, in one call.
 *
 * `alternatives` are the candidates that were not chosen, so replacing a change
 * offers a real alternative from the same rule library rather than a free-text
 * suggestion nobody costed.
 */
export function proposeChanges(routine: UserRoutine, plan: SavedPlan): {
  selection: Selection;
  changes: PlanChange[];
  params: Record<string, Record<string, string | number>>;
  replacements: ChangeCandidate[];
  maxChanges: number;
} {
  const selection = selectChanges(contextFor(routine, plan));
  const params: Record<string, Record<string, string | number>> = {};

  for (const c of [...selection.chosen, ...selection.rejected]) params[c.id] = c.params;

  return {
    selection,
    changes: selection.chosen.map((c) => toChange(c)),
    params,
    replacements: selection.rejected,
    maxChanges: SAFETY_LIMITS.maxSimultaneousChanges,
  };
}
