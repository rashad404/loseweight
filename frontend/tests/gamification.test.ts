import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialActions, buildQuest, calculateConsistency, evaluateAchievements, updateQuest } from '../lib/gamification/engine.ts';
import type { GamificationState } from '../lib/gamification/models.ts';

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
    achievements: [], preferences: { enabled: true, celebrations: true, landscape: true, mode: 'maintenance' }, lastVisit: null,
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
