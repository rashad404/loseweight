import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialActions, buildQuest, calculateConsistency, calculateProgression, evaluateAchievements, updateQuest } from '../lib/gamification/engine.ts';
import type { GamificationState } from '../lib/gamification/models.ts';
import { exportGame, importGame, rescheduleAction } from '../lib/gamification/storage.ts';

const dated = (state: 'available' | 'completed' | 'adjusted' | 'rescheduled' | 'skipped_reasonable' | 'skipped', date = '2026-08-31') => ({
  ...buildInitialActions(date)[0], id: `${date}:${state}`, state,
});

test('consistency rewards completed and adjusted actions only', () => {
  const result = calculateConsistency([
    dated('completed'), dated('adjusted'), dated('skipped'), dated('available'),
  ], new Date('2026-08-31T12:00:00Z'));
  assert.deepEqual(result, { completed: 2, planned: 4, ratio: 0.5, activeDays: 1 });
});

test('reasonable skips and rescheduled actions are neutral', () => {
  const result = calculateConsistency([
    dated('completed'), dated('skipped_reasonable'), dated('rescheduled'),
  ], new Date('2026-08-31T12:00:00Z'));
  assert.equal(result.completed, 1);
  assert.equal(result.planned, 1);
});

test('weight and calorie values cannot enter the consistency calculation', () => {
  const actions = [dated('completed')];
  assert.deepEqual(calculateConsistency(actions, new Date('2026-08-31T12:00:00Z')),
    calculateConsistency(actions, new Date('2026-08-31T12:00:00Z')));
  assert.equal('weightKg' in actions[0], false);
  assert.equal('calories' in actions[0], false);
});

test('quest counts distinct days, not repeated taps', () => {
  const quest = buildQuest(new Date('2026-08-31T12:00:00Z'));
  const actions = [dated('completed', '2026-08-31'), { ...dated('adjusted', '2026-08-31'), id: 'second' }, dated('completed', '2026-09-01')];
  assert.equal(updateQuest(quest, actions).progress, 2);
});

test('achievements are deterministic and idempotent', () => {
  const state: GamificationState = {
    version: 1, actions: [dated('completed'), dated('adjusted')], quest: { ...buildQuest(), completed: true },
    achievements: [], preferences: { enabled: true, celebrations: true, landscape: true, mode: 'maintenance', theme: 'mint' },
    circle: null, sync: { deviceId: 'test', revision: 0, updatedAt: '2026-08-31T00:00:00Z' }, lastVisit: null,
  };
  const once = evaluateAchievements(state, new Date('2026-08-31T12:00:00Z'));
  const twice = evaluateAchievements({ ...state, achievements: once }, new Date('2026-08-31T12:00:00Z'));
  assert.deepEqual(twice, once);
});

test('every generated action has explicit provenance', () => {
  for (const action of buildInitialActions('2026-08-31')) {
    assert.ok(action.sourceType);
    assert.ok(action.sourceLabel);
  }
});

test('rescheduling is neutral and creates one action on the new date', () => {
  const base = dated('available');
  const state: GamificationState = {
    version: 1, actions: [base], quest: buildQuest(), achievements: [],
    preferences: { enabled: true, celebrations: true, landscape: true, mode: 'loss', theme: 'mint' },
    circle: null, sync: { deviceId: 'test', revision: 0, updatedAt: '2026-08-31T00:00:00Z' }, lastVisit: null,
  };
  const moved = rescheduleAction(state, base.id, '2026-09-01');
  assert.equal(moved.actions[0].state, 'rescheduled');
  assert.equal(moved.actions[1].date, '2026-09-01');
  assert.equal(rescheduleAction(moved, base.id, '2026-09-01').actions.length, 2);
});

test('sync snapshot round trips without health measurements', () => {
  const state: GamificationState = {
    version: 1, actions: [dated('completed')], quest: buildQuest(), achievements: [],
    preferences: { enabled: true, celebrations: true, landscape: true, mode: 'maintenance', theme: 'mint' },
    circle: null, sync: { deviceId: 'test', revision: 1, updatedAt: '2026-08-31T00:00:00Z' }, lastVisit: null,
  };
  const raw = exportGame(state);
  assert.deepEqual(importGame(raw), state);
  assert.equal(raw.includes('weightKg'), false);
  assert.equal(raw.includes('calories'), false);
});

test('progression uses actions and achievements, never health outcomes', () => {
  const state: GamificationState = {
    version: 1,
    actions: Array.from({ length: 5 }, (_, index) => ({ ...dated('completed'), id: `done-${index}` })),
    quest: buildQuest(), achievements: [],
    preferences: { enabled: true, celebrations: true, landscape: true, mode: 'loss', theme: 'mint' },
    circle: null, sync: { deviceId: 'test', revision: 0, updatedAt: '2026-08-31T00:00:00Z' }, lastVisit: null,
  };
  const progress = calculateProgression(state);
  assert.equal(progress.level, 2);
  assert.deepEqual(progress.unlockedThemes, ['mint', 'violet']);
  assert.equal(JSON.stringify(progress).includes('weight'), false);
});
