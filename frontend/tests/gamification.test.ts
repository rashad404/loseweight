import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuest, calculateConsistency, calculateProgression, evaluateAchievements, updateQuest } from '../lib/gamification/engine.ts';
import type { WeeklyPlan } from '../lib/routine/models.ts';
import type { GamificationState } from '../lib/gamification/models.ts';
import { exportGame, importGame } from '../lib/gamification/storage.ts';
import { setActionState, type ActionState, type DayRecord } from '../lib/plan/storage.ts';
import { localizedChangeParams } from '../lib/routine/presentation.ts';

const change = {
  id: 'change-1', kind: 'adjust-portion' as const, targetMealId: null, targetItemId: null,
  title: 'change.title', params: {}, rationale: 'change.reason', ruleId: 'portion-rule',
  difficulty: 'easy' as const, kcalSavedLow: 100, kcalSavedHigh: 150, proteinAddedG: 0,
  fiberAddedG: 0, alternatives: ['change.alternative'], accepted: true,
};

const plan = {
  version: 1, createdAt: '2026-08-31T00:00:00Z', planStartedOn: '2026-08-31', weekNumber: 1,
  changes: [change], templates: [], flexibleMeal: 'flex', eatingOutRules: [], hungerRescue: [],
  expectedLossLowKg: 0.1, expectedLossHighKg: 0.2, estimatedDailySavingLow: 100, estimatedDailySavingHigh: 150,
} satisfies WeeklyPlan;

const day = (state: ActionState, date = '2026-08-31'): DayRecord => setActionState(
  { date, followed: [], skipped: [], usedFlexibleMeal: false, actions: {} }, change.id, state,
);

const game = (quest = buildQuest(plan, new Date('2026-08-31T12:00:00Z'))): GamificationState => ({
  version: 2, quest, achievements: [],
  preferences: { enabled: true, celebrations: true, landscape: true, mode: 'maintenance', theme: 'mint' },
  circle: null, sync: { deviceId: 'test', revision: 0, updatedAt: '2026-08-31T00:00:00Z' }, lastVisit: null,
});

test('consistency rewards completed and adjusted canonical check-ins', () => {
  const result = calculateConsistency([day('completed'), day('adjusted', '2026-08-30'), day('skipped', '2026-08-29')], plan, new Date('2026-08-31T12:00:00Z'));
  assert.deepEqual(result, { completed: 2, planned: 3, ratio: 2 / 3, activeDays: 2 });
});

test('reasonable skips and rescheduled actions are neutral', () => {
  const result = calculateConsistency([day('completed'), day('skipped_reasonable', '2026-08-30'), day('rescheduled', '2026-08-29')], plan, new Date('2026-08-31T12:00:00Z'));
  assert.equal(result.completed, 1);
  assert.equal(result.planned, 1);
});

test('unanswered days are unknown rather than failures', () => {
  const unanswered = { date: '2026-08-30', followed: [], skipped: [], usedFlexibleMeal: false, actions: {} };
  assert.deepEqual(calculateConsistency([unanswered], plan, new Date('2026-08-31T12:00:00Z')), { completed: 0, planned: 0, ratio: 0, activeDays: 0 });
});

test('quest is tied to an accepted change and counts distinct days', () => {
  const quest = buildQuest(plan, new Date('2026-08-31T12:00:00Z'));
  assert.equal(quest.sourceChangeId, change.id);
  assert.equal(updateQuest(quest, [day('completed'), day('adjusted', '2026-09-01')]).progress, 2);
});

test('achievements are deterministic and idempotent', () => {
  const state = game({ ...buildQuest(plan), completed: true });
  const history = [day('completed'), day('adjusted', '2026-08-30')];
  const once = evaluateAchievements(state, history, plan, new Date('2026-08-31T12:00:00Z'));
  const twice = evaluateAchievements({ ...state, achievements: once }, history, plan, new Date('2026-08-31T12:00:00Z'));
  assert.deepEqual(twice, once);
});

test('rich states preserve the arrays used by adaptive review', () => {
  assert.deepEqual(day('adjusted').followed, [change.id]);
  assert.deepEqual(day('skipped').skipped, [change.id]);
  assert.deepEqual(day('skipped_reasonable').skipped, []);
});

test('sync snapshot round trips without health measurements', () => {
  const state = game();
  const history = [day('completed')];
  const raw = exportGame(state, history);
  assert.deepEqual(importGame(raw), { state, days: history });
  assert.equal(raw.includes('weightKg'), false);
  assert.equal(raw.includes('calories'), false);
});

test('progression uses canonical action credits, never achievements or health outcomes', () => {
  const state = { ...game(), achievements: [{ id: 'first-check' as const, earnedAt: '2026-08-31T00:00:00Z' }] };
  const history = Array.from({ length: 5 }, (_, index) => day('completed', `2026-08-${String(27 + index).padStart(2, '0')}`));
  const progress = calculateProgression(state, history);
  assert.equal(progress.current, 5);
  assert.equal(progress.level, 2);
  assert.deepEqual(progress.unlockedThemes, ['mint', 'violet']);
  assert.equal(JSON.stringify(progress).includes('weight'), false);
});

test('a rejected change cannot become the weekly quest', () => {
  const rejected = { ...plan, changes: [{ ...change, accepted: false }] };
  assert.equal(buildQuest(rejected).sourceChangeId, null);
});

test('enum parameters are localized before plan copy is rendered', () => {
  const translated = localizedChangeParams({ meal: 'lunch', when: 'late-night', grams: 27 }, (key) => `translated:${key}`);
  assert.deepEqual(translated, { meal: 'translated:meal.lunch', when: 'translated:when.late-night', grams: 27 });
});
