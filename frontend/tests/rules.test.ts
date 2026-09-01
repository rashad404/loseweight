import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectChanges, RULES, type RuleContext } from '../lib/routine/rules.ts';
import { SAFETY_LIMITS } from '../lib/safety/boundaries.ts';
import { usRoutine, azRoutine, routine, meal, item } from './fixtures/routines.ts';

const ctx = (over: Partial<RuleContext> = {}): RuleContext => ({
  routine: usRoutine(),
  currentKcal: 1800, targetKcal: 1500, maintenanceKcal: 2100,
  proteinTargetG: 120, fiberTargetG: 25,
  currentProteinG: 82, currentFiberG: 5,
  ...over,
});

test('never proposes more than the safety limit of changes', () => {
  const s = selectChanges(ctx());
  assert.ok(s.chosen.length <= SAFETY_LIMITS.maxSimultaneousChanges, `chose ${s.chosen.length}`);
});

test('cooking fat is chosen before a staple portion cut', () => {
  const s = selectChanges(ctx());
  const fat = s.chosen.findIndex((c) => c.kind === 'reduce-cooking-fat');
  const portion = s.chosen.findIndex((c) => c.kind === 'adjust-portion');
  assert.ok(fat !== -1, 'fat change should be chosen');
  if (portion !== -1) assert.ok(fat < portion, 'fat must rank above portion');
});

test('at most one non-easy change at a time', () => {
  const s = selectChanges(ctx());
  const hard = s.chosen.filter((c) => c.difficulty !== 'easy').length;
  assert.ok(hard <= 1, `chose ${hard} non-easy changes`);
});

test('a non-negotiable food is never targeted', () => {
  const s = selectChanges(ctx({ routine: azRoutine() }));
  const all = [...s.chosen];
  const tea = azRoutine().meals.find((m) => m.slot === 'drink')!.items[0];
  assert.ok(!all.some((c) => c.params.food === tea.match!.name),
    'the non-negotiable drink must not be targeted');
});

test('liquid calories are proposed when the drink is not protected', () => {
  const s = selectChanges(ctx());
  assert.ok([...s.chosen, ...s.rejected].some((c) => c.kind === 'swap-liquid-calories'));
});

test('protein is added only when the routine falls short', () => {
  const short = selectChanges(ctx({ currentProteinG: 40 }));
  assert.ok([...short.chosen, ...short.rejected].some((c) => c.kind === 'add-protein'));

  const met = selectChanges(ctx({ currentProteinG: 130 }));
  assert.ok(![...met.chosen, ...met.rejected].some((c) => c.kind === 'add-protein'));
});

test('adding protein claims no calorie saving', () => {
  const s = selectChanges(ctx({ currentProteinG: 40 }));
  const p = [...s.chosen, ...s.rejected].find((c) => c.kind === 'add-protein')!;
  assert.equal(p.kcalSavedHigh, 0, 'adding food cannot create a deficit');
  assert.ok(p.proteinAddedG > 0);
});

test('a planned snack is proposed for a known hungry window, not a vague one', () => {
  const withWindow = selectChanges(ctx({ routine: routine(usRoutine().meals, { hungriest: 'afternoon' }) }));
  assert.ok([...withWindow.chosen, ...withWindow.rejected].some((c) => c.kind === 'add-planned-snack'));

  const vague = selectChanges(ctx({ routine: routine(usRoutine().meals, { hungriest: 'varies' }) }));
  assert.ok(![...vague.chosen, ...vague.rejected].some((c) => c.kind === 'add-planned-snack'));
});

test('does not overshoot the deficit the planner asked for', () => {
  // Only 100 kcal needs cutting, but the routine offers far more.
  const s = selectChanges(ctx({ currentKcal: 1600, targetKcal: 1500 }));
  assert.ok(s.estimatedDailySavingHigh <= 400,
    `saving ${s.estimatedDailySavingHigh} overshoots a 100 kcal need`);
});

test('reports when the changes cannot reach the target', () => {
  // A tiny routine with nothing much to cut, against a large required deficit.
  const thin = routine([meal('breakfast', [item('apple', 90, { fiber: 3 })])]);
  const s = selectChanges(ctx({ routine: thin, currentKcal: 2400, targetKcal: 1500 }));
  assert.equal(s.shortOfTarget, true);
});

test('expected weekly loss is derived from the saving range, not invented', () => {
  const s = selectChanges(ctx());
  const expectedLow = Math.round(((s.estimatedDailySavingLow * 7) / 7700) * 100) / 100;
  assert.equal(s.expectedLossLowKg, expectedLow);
  assert.ok(s.expectedLossHighKg >= s.expectedLossLowKg);
});

test('every chosen change is traceable to the rule that selected it', () => {
  const s = selectChanges(ctx());
  const ids = new Set(RULES.map((r) => r.id));
  for (const c of s.chosen) {
    assert.ok(ids.has(c.ruleId), `${c.ruleId} is not a known rule`);
    assert.ok(c.titleKey && c.rationaleKey, 'must carry renderable copy keys');
    assert.ok(c.alternativeKeys.length >= 2, 'must offer interchangeable options');
  }
});

test('selection is reproducible for the same input', () => {
  const a = selectChanges(ctx());
  const b = selectChanges(ctx());
  assert.deepEqual(a.chosen.map((c) => c.ruleId), b.chosen.map((c) => c.ruleId));
});

test('a plan that needs a deficit always contains a deficit change', () => {
  // Regression: three satiety changes once filled every slot and saved nothing.
  // Correct by every individual rule, useless as a whole.
  for (const r of [usRoutine(), azRoutine()]) {
    const s = selectChanges(ctx({ routine: r, currentProteinG: 40, currentFiberG: 4 }));
    assert.ok(s.estimatedDailySavingHigh > 0,
      'a plan needing a deficit must include at least one calorie-reducing change');
  }
});

test('each chosen change comes from a different rule', () => {
  const s = selectChanges(ctx());
  const ruleIds = s.chosen.map((c) => c.ruleId);
  assert.equal(new Set(ruleIds).size, ruleIds.length,
    'three changes should be three kinds of action, not one repeated');
});

test('expected loss reflects the accepted changes, not the planner target rate', () => {
  const s = selectChanges(ctx({ routine: azRoutine(), currentProteinG: 46, currentFiberG: 6 }));
  const fromSaving = Math.round(((s.estimatedDailySavingHigh * 7) / 7700) * 100) / 100;
  assert.equal(s.expectedLossHighKg, fromSaving);
});

test('an Azerbaijani routine produces workable changes without touching the tea', () => {
  const s = selectChanges(ctx({ routine: azRoutine(), currentProteinG: 46, currentFiberG: 6 }));
  assert.ok(s.chosen.length > 0, 'should find something to change');
  assert.ok(s.chosen.length <= 3);
  assert.ok(!s.chosen.some((c) => String(c.params.food ?? '').includes('sweet tea')));
});

test('cooking fat is recognised in Azerbaijani and Russian, not only English', () => {
  // These rules matched with \b, which JavaScript defines against ASCII word
  // characters, so every non-English term in them was dead and neither rule
  // ever fired for an Azerbaijani or Russian routine.
  for (const fat of ['zeytun yağı', 'kərə yağı', 'подсолнечное масло']) {
    const r = routine([
      meal('breakfast', [item('çörək', 160, { protein: 5 })]),
      meal('lunch', [item(fat, 240), item('düyü', 300, { protein: 5 })]),
    ]);
    const { chosen } = selectChanges(ctx({ routine: r, currentKcal: 700, targetKcal: 450 }));
    assert.ok(
      chosen.some((c) => c.kind === 'reduce-cooking-fat'),
      `cooking fat not recognised in "${fat}"`,
    );
  }
});

test('liquid calories are recognised in Azerbaijani and Russian', () => {
  for (const drink of ['meyvə şirəsi', 'апельсиновый сок', 'пиво']) {
    const r = routine([
      meal('breakfast', [item('çörək', 200, { protein: 5 })]),
      meal('lunch', [item('düyü', 400, { protein: 5 })]),
      meal('snack', [item(drink, 220)]),
    ]);
    const { chosen } = selectChanges(ctx({ routine: r, currentKcal: 820, targetKcal: 550 }));
    assert.ok(
      chosen.some((c) => c.kind === 'swap-liquid-calories'),
      `liquid calories not recognised in "${drink}"`,
    );
  }
});

test('a word that merely starts like a food term is not treated as one', () => {
  const r = routine([
    meal('breakfast', [item('sodium supplement', 200), item('winery tour snack', 300)]),
  ]);
  const { chosen } = selectChanges(ctx({ routine: r, currentKcal: 500, targetKcal: 400 }));
  assert.ok(!chosen.some((c) => c.kind === 'swap-liquid-calories'),
    '"sodium" and "winery" must not read as drinks');
});
