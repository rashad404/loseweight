import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewPlan, trendKgPerWeek, adherenceFrom, measuredGapKcal } from '../lib/routine/review.ts';
import { SAFETY_LIMITS } from '../lib/safety/boundaries.ts';
import type { WeeklyPlan, PlanChange } from '../lib/routine/models.ts';
import type { DayRecord, WeightEntry } from '../lib/plan/storage.ts';

const change = (id: string): PlanChange => ({
  id, kind: 'adjust-portion', targetMealId: null, targetItemId: null,
  title: 'change.portion.title', params: {}, rationale: 'change.portion.rationale',
  ruleId: 'portion', difficulty: 'easy',
  kcalSavedLow: 200, kcalSavedHigh: 300, proteinAddedG: 0, fiberAddedG: 0,
  alternatives: [], accepted: true,
});

const plan = (over: Partial<WeeklyPlan> = {}): WeeklyPlan => ({
  version: 1, createdAt: '2026-01-01T00:00:00Z', planStartedOn: '2026-01-01',
  weekNumber: 1, changes: [change('c1')], templates: [], flexibleMeal: 'situation.flexible',
  eatingOutRules: [], hungerRescue: [],
  // 250 kcal a day is about 0.23 kg a week.
  expectedLossLowKg: 0.18, expectedLossHighKg: 0.27,
  estimatedDailySavingLow: 200, estimatedDailySavingHigh: 300,
  ...over,
});

/** Weigh-ins on a straight line at a chosen rate. */
const weighIns = (kgPerWeek: number, count = 8, start = 90): WeightEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    recordedOn: new Date(Date.parse('2026-01-01') + i * 3 * 86_400_000).toISOString().slice(0, 10),
    weightKg: start + (kgPerWeek / 7) * (i * 3),
  }));

const days = (followed: number, total: number): DayRecord[] =>
  Array.from({ length: total }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    followed: i < followed ? ['c1'] : [],
    skipped: i < followed ? [] : ['c1'],
    usedFlexibleMeal: false,
  }));

const later = '2026-02-15';

test('a trend is fitted through every point, not taken end to end', () => {
  const steady = weighIns(-0.5);
  assert.ok(Math.abs(trendKgPerWeek(steady)! + 0.5) < 0.01);

  // One bloated morning at the end must not swing the verdict.
  const noisy = [...steady];
  noisy[noisy.length - 1] = { ...noisy[noisy.length - 1], weightKg: noisy[noisy.length - 1].weightKg + 1.5 };
  assert.ok(trendKgPerWeek(noisy)! < -0.2, 'one bad reading should not erase the trend');
});

test('nothing is judged before the safety window, however clear the data', () => {
  const r = reviewPlan(plan(), weighIns(-2), days(20, 20), '2026-01-10');

  assert.equal(r.verdict, 'too-early');
  assert.equal(r.action, 'wait');
  assert.ok(SAFETY_LIMITS.minDaysBeforeAdjusting > 14, 'the window is meant to outlast water weight');
});

test('too few weigh-ins is not a verdict about the plan', () => {
  const r = reviewPlan(plan(), weighIns(-0.5, 2), days(20, 20), later);

  assert.equal(r.verdict, 'not-enough-data');
  assert.equal(r.action, 'wait');
});

test('a plan that was not followed is not judged as a plan', () => {
  // Tightening a plan nobody followed makes it harder, not better.
  const r = reviewPlan(plan(), weighIns(0), days(2, 20), later);

  assert.equal(r.verdict, 'not-following');
  assert.equal(r.action, 'fix-adherence');
});

test('losing roughly as predicted is left alone', () => {
  const r = reviewPlan(plan(), weighIns(-0.23), days(18, 20), later);

  assert.equal(r.verdict, 'on-track');
  assert.equal(r.action, 'keep-going');
});

test('losing much faster than planned is eased off, not celebrated', () => {
  const r = reviewPlan(plan(), weighIns(-1.2), days(18, 20), later);

  assert.equal(r.verdict, 'faster-than-expected');
  assert.equal(r.action, 'ease-off');
});

test('losing slower than planned adds one change', () => {
  const r = reviewPlan(plan(), weighIns(-0.05), days(18, 20), later);

  assert.equal(r.verdict, 'slower-than-expected');
  assert.equal(r.action, 'add-a-change');
});

test('a followed plan with no movement at all goes to a clinician', () => {
  const r = reviewPlan(plan(), weighIns(0), days(20, 20), later);

  assert.equal(r.verdict, 'no-change');
  assert.equal(r.action, 'see-a-clinician');
});

test('unanswered days are unknown, not failures', () => {
  const untouched: DayRecord[] = Array.from({ length: 20 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    followed: [], skipped: [], usedFlexibleMeal: false,
  }));

  const { adherence, answered } = adherenceFrom(untouched, plan());
  assert.equal(adherence, null, 'never opening the page is not evidence of failure');
  assert.equal(answered, 0);
});

test('reasonable skips and reschedules stay neutral in adaptive review', () => {
  const weekly = plan();
  const neutral = [{
    date: '2026-08-31', followed: [], skipped: [], usedFlexibleMeal: false,
    actions: Object.fromEntries(weekly.changes.filter((change) => change.accepted).map((change) => [change.id, { state: 'skipped_reasonable' as const, completedAt: null, replacement: null, rescheduledTo: null }])),
  }];
  // Neutral means it does not count against them: adherence stays null rather
  // than becoming 0, so no "not following" verdict is triggered by one day of
  // legitimate skips. The day is still counted as answered, because reporting
  // it as unanswered made deferring everything indistinguishable from never
  // opening the page, and the plan was then judged as though it had been kept.
  assert.deepEqual(adherenceFrom(neutral, weekly), { adherence: null, answered: 1 });
});

test('maintenance never labels stable weight as stalled progress', () => {
  const result = reviewPlan(plan({ mode: 'maintenance' }), weighIns(0), days(20, 20), later);
  assert.equal(result.verdict, 'maintenance');
  assert.equal(result.action, 'keep-going');
});

test('the measured gap is reported in calories, signed the readable way', () => {
  const slow = reviewPlan(plan(), weighIns(-0.05), days(18, 20), later);
  const gap = measuredGapKcal(slow)!;

  assert.ok(gap > 0, 'losing slower means more calories than assumed');
  assert.ok(gap < 400, `a plausible size, got ${gap}`);
});

/* --------------------------------- deferring every change is not adherence -- */

/** Every accepted change given the same action state, every day. */
const deferred = (state: string, total = 20): DayRecord[] =>
  Array.from({ length: total }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    followed: [], skipped: [], usedFlexibleMeal: false,
    actions: { c1: { state } },
  } as unknown as DayRecord));

test('deferring every change is never read as having followed the plan', () => {
  // Excluding reasonable skips from the denominator made "answered and did
  // nothing" look identical to "never answered", so a fourth change was
  // proposed to someone doing none of the first three.
  for (const state of ['skipped_reasonable', 'rescheduled']) {
    const slow = reviewPlan(plan(), weighIns(-0.05), deferred(state), later);
    assert.equal(slow.action, 'fix-adherence', state);
    assert.notEqual(slow.action, 'add-a-change');
  }
});

test('a stall is only sent to a clinician when the plan was demonstrably followed', () => {
  // The message says "on a plan you did follow". Reading unknown adherence as
  // full adherence made that claim on no evidence at all.
  const noRecords = reviewPlan(plan(), weighIns(0), [], later);
  assert.notEqual(noRecords.action, 'see-a-clinician', 'nobody marked a single day');

  const deferredStall = reviewPlan(plan(), weighIns(0), deferred('skipped_reasonable'), later);
  assert.notEqual(deferredStall.action, 'see-a-clinician');

  const reallyFollowed = reviewPlan(plan(), weighIns(0), days(20, 20), later);
  assert.equal(reallyFollowed.action, 'see-a-clinician', 'the real case still reaches it');
});
