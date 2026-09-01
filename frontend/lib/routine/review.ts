import { KCAL_PER_KG } from '../health/calculations.ts';
import { SAFETY_LIMITS } from '../safety/boundaries.ts';
import type { WeeklyPlan } from './models.ts';
import type { DayRecord, WeightEntry } from '../plan/storage.ts';

/**
 * Deciding whether a plan is working, and what to do about it.
 *
 * Every threshold here is fixed in code. Nothing in this file asks a model
 * anything: an adjustment changes how much someone eats, so it is a safety
 * decision, and safety decisions are made by rules that can be read and tested.
 *
 * The hardest constraint is patience. Weight moves with water, glycogen, salt
 * and the menstrual cycle by more than a week of real fat loss, so reacting to
 * a fortnight of data mostly means reacting to noise. Nothing adjusts before
 * `minDaysBeforeAdjusting` days, and nothing adjusts on fewer than four
 * weigh-ins, however much the numbers seem to say.
 */

export type Verdict =
  | 'maintenance'
  | 'too-early'
  | 'not-enough-data'
  | 'on-track'
  | 'faster-than-expected'
  | 'slower-than-expected'
  | 'not-following'
  | 'no-change';

export type Action =
  | 'wait'
  | 'keep-going'
  | 'ease-off'
  | 'add-a-change'
  | 'fix-adherence'
  | 'see-a-clinician';

export interface Review {
  verdict: Verdict;
  action: Action;
  /** Days of data behind this. */
  days: number;
  weighIns: number;
  /** Measured trend, kg per week, from a fitted line rather than first-to-last. */
  actualKgPerWeek: number | null;
  expectedKgPerWeek: number;
  /** Proportion of answered days where every accepted change was followed. */
  adherence: number | null;
  answeredDays: number;
  /** Message key explaining the verdict. Never generated text. */
  explanationKey: string;
}

/** Minimum weigh-ins before any trend is treated as real. */
const MIN_WEIGH_INS = 4;

/** Below this, the plan is not what is being tested. */
const ADHERENCE_FLOOR = 0.6;

/**
 * How far from expected still counts as on track.
 *
 * Loosely set on purpose. A prediction from population equations is routinely
 * 10% out for an individual, so treating a 15% miss as a signal would have
 * people chasing their own measurement error.
 */
const TOLERANCE = 0.4;

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * Trend in kg per week from a least-squares fit.
 *
 * First-to-last would let a single bloated morning at either end decide the
 * verdict. A fitted line uses every point, which is the whole reason for
 * asking people to weigh often.
 */
export function trendKgPerWeek(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  const origin = Date.parse(sorted[0].recordedOn);

  const points = sorted.map((e) => ({
    x: (Date.parse(e.recordedOn) - origin) / 86_400_000,
    y: e.weightKg,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slopePerDay = (n * sumXY - sumX * sumY) / denominator;

  return Math.round(slopePerDay * 7 * 1000) / 1000;
}

/**
 * Share of answered days on which every accepted change was followed.
 *
 * Three outcomes, and the difference between the last two is a safety matter:
 *  - `answered: 0`, adherence null: the person never told us anything.
 *  - `answered > 0`, adherence null: they answered, and deferred every change
 *    with a reason. That is not adherence data, but it is emphatically not
 *    evidence that the plan was followed.
 *  - adherence set: a real proportion.
 *
 * Collapsing the middle case into the first let someone who reasonably skipped
 * every change for three weeks be judged as though they had done all of them.
 */
export function adherenceFrom(days: DayRecord[], plan: WeeklyPlan): {
  adherence: number | null;
  answered: number;
} {
  const accepted = plan.changes.filter((c) => c.accepted);
  if (accepted.length === 0) return { adherence: null, answered: 0 };

  // A day nobody answered is unknown, not a failure. Counting unopened days as
  // misses would turn "did not use the site" into "the plan is not working".
  const answered = days.filter((d) => d.followed.length + d.skipped.length > 0 || Object.keys(d.actions ?? {}).length > 0);
  if (answered.length === 0) return { adherence: null, answered: 0 };

  const eligible = answered.map((day) => ({
    day,
    changes: accepted.filter((change) => {
      const state = day.actions?.[change.id]?.state;
      return state !== 'skipped_reasonable' && state !== 'rescheduled';
    }),
  })).filter(({ changes }) => changes.length > 0);
  // Answered, but every change was deferred or rescheduled. There is nothing
  // to take a proportion of, so the count is reported without one.
  if (eligible.length === 0) return { adherence: null, answered: answered.length };
  const followed = eligible.filter(({ day, changes }) => changes.every((change) => {
    const state = day.actions?.[change.id]?.state;
    return state === 'completed' || state === 'adjusted' || day.followed.includes(change.id);
  }));

  return { adherence: followed.length / eligible.length, answered: eligible.length };
}

export function reviewPlan(
  plan: WeeklyPlan,
  entries: WeightEntry[],
  days: DayRecord[],
  today = new Date().toISOString().slice(0, 10),
): Review {
  if (plan.mode === 'maintenance') {
    return {
      verdict: 'maintenance', action: 'keep-going', days: daysBetween(plan.createdAt.slice(0, 10), today),
      weighIns: entries.filter((entry) => entry.recordedOn >= plan.createdAt.slice(0, 10)).length,
      actualKgPerWeek: null, expectedKgPerWeek: 0, adherence: adherenceFrom(days, plan).adherence,
      answeredDays: adherenceFrom(days, plan).answered, explanationKey: 'review.maintenance',
    };
  }
  const expectedKgPerWeek = -(plan.expectedLossLowKg + plan.expectedLossHighKg) / 2;
  const { adherence, answered } = adherenceFrom(days, plan);
  const elapsed = daysBetween(plan.createdAt.slice(0, 10), today);

  const sinceStart = entries.filter((e) => e.recordedOn >= plan.createdAt.slice(0, 10));
  const actual = trendKgPerWeek(sinceStart);

  const base = {
    days: elapsed,
    weighIns: sinceStart.length,
    actualKgPerWeek: actual,
    expectedKgPerWeek,
    adherence,
    answeredDays: answered,
  };

  // Patience first, and it is not negotiable by any other signal.
  if (elapsed < SAFETY_LIMITS.minDaysBeforeAdjusting) {
    return { ...base, verdict: 'too-early', action: 'wait', explanationKey: 'review.tooEarly' };
  }

  if (sinceStart.length < MIN_WEIGH_INS || actual === null) {
    return {
      ...base, verdict: 'not-enough-data', action: 'wait', explanationKey: 'review.notEnoughData',
    };
  }

  // Before judging the plan, check whether the plan is what was tested.
  // Tightening a plan nobody followed makes it harder to follow, not better.
  if (adherence !== null && adherence < ADHERENCE_FLOOR) {
    return {
      ...base, verdict: 'not-following', action: 'fix-adherence',
      explanationKey: 'review.notFollowing',
    };
  }

  // Answered every day and deferred every change. Each skip may have been
  // entirely reasonable, and none of them tested the plan, so the useful
  // question is what keeps getting in the way rather than what to cut next.
  if (adherence === null && answered > 0) {
    return {
      ...base, verdict: 'not-following', action: 'fix-adherence',
      explanationKey: 'review.allDeferred',
    };
  }

  // Losing much faster than intended is not a success to encourage. It usually
  // means eating far below target, which costs muscle and rarely lasts.
  const fasterLimit = expectedKgPerWeek * (1 + TOLERANCE) - 0.25;
  if (actual < fasterLimit) {
    return {
      ...base, verdict: 'faster-than-expected', action: 'ease-off',
      explanationKey: 'review.faster',
    };
  }

  const slowerLimit = expectedKgPerWeek * (1 - TOLERANCE);
  if (actual > slowerLimit) {
    // Weight that has not moved at all, on a plan that was followed, is worth
    // a conversation with a clinician rather than another calorie cut.
    // Only when we actually know the plan was followed. Reading unknown
    // adherence as full adherence sent people to a clinician on the stated
    // grounds that they had followed a plan we had no evidence they followed.
    if (Math.abs(actual) < 0.05 && adherence !== null && adherence >= 0.8) {
      return {
        ...base, verdict: 'no-change', action: 'see-a-clinician',
        explanationKey: 'review.noChange',
      };
    }

    return {
      ...base, verdict: 'slower-than-expected', action: 'add-a-change',
      explanationKey: 'review.slower',
    };
  }

  return { ...base, verdict: 'on-track', action: 'keep-going', explanationKey: 'review.onTrack' };
}

/**
 * The daily gap between what the plan predicted and what happened.
 *
 * Reported so an adjustment can be sized from evidence rather than from a
 * round number. Positive means more calories are going in than the plan
 * assumed.
 */
export function measuredGapKcal(review: Review): number | null {
  if (review.actualKgPerWeek === null) return null;

  const difference = review.actualKgPerWeek - review.expectedKgPerWeek;

  return Math.round((difference * KCAL_PER_KG) / 7);
}
