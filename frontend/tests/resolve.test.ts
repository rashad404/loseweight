import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoutine, itemsNeedingAttention, uncertainItems } from '../lib/routine/resolve.ts';
import type { ParsedRoutine } from '../lib/ai/parse-routine.ts';

const routine = (items: ParsedRoutine['meals'][number]['items']): ParsedRoutine => ({
  meals: [{ slot: 'breakfast', whenDescribed: null, items }],
  nonNegotiables: [],
});

const item = (text: string, quantity: number | null = null, unit: string | null = null) =>
  ({ text, quantity, unit, household: null });

const flat = (r: Awaited<ReturnType<typeof resolveRoutine>>) => r.meals.flatMap((m) => m.items);

test('a phrase naming two foods becomes one row each', async () => {
  // "bread with butter" resolved to butter alone, so the bread vanished from
  // the total while the row still looked matched.
  const r = await resolveRoutine(routine([item('bread with butter')]));
  const rows = flat(r);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((i) => i.rawText), ['bread', 'butter']);
  assert.ok(rows.every((i) => i.match?.nutrition), 'both halves are priced');
});

test('a stated amount stays with the food it was written before', async () => {
  // "two slices of bread with butter" measures the bread. Copying it onto
  // every half described the butter as slices as well.
  const rows = flat(await resolveRoutine(routine([
    { text: 'bread with butter', quantity: 2, unit: 'slices', household: 'two slices' },
  ])));

  assert.equal(rows[0].portion.grams, 60, 'two slices of bread');
  assert.equal(rows[1].portion.grams, null);
  assert.equal(rows[1].portion.household, null, 'the butter is not measured in slices');
});

test('a phrase is left whole when one half is not a food we can price', async () => {
  const r = await resolveRoutine(routine([item('bread with zzzqqq')]));
  const rows = flat(r);

  assert.equal(rows.length, 1, 'no fragmenting into unmatched rows');
  assert.equal(rows[0].rawText, 'bread with zzzqqq');
});

test('a count with no unit multiplies the portion', async () => {
  // "2 cokes a day" counted as one coke, because a quantity with no unit
  // attached to it was dropped on the way to the lookup.
  const one = flat(await resolveRoutine(routine([item('coke')])));
  const two = flat(await resolveRoutine(routine([item('coke', 2)])));

  const kcal = (rows: typeof one) => rows[0].match!.nutrition!.kcalHigh;
  // Within a rounding step: each figure is rounded once, so doubling the
  // portion and doubling the rounded result can differ by one.
  assert.ok(Math.abs(kcal(two) - kcal(one) * 2) <= 1,
    `${kcal(two)} should be twice ${kcal(one)}`);
  assert.ok(kcal(two) > kcal(one) * 1.9, 'the second serving is actually counted');
});

test('an implausible count does not multiply the portion', async () => {
  // A parse that reads a year or a price as a quantity must not produce a
  // 2025-portion breakfast.
  const rows = flat(await resolveRoutine(routine([item('coke', 2025)])));
  const one = flat(await resolveRoutine(routine([item('coke')])));

  assert.equal(rows[0].match!.nutrition!.kcalHigh, one[0].match!.nutrition!.kcalHigh);
});

test('a stated weight wins over a stated count', async () => {
  const rows = flat(await resolveRoutine(routine([item('coke', 500, 'ml')])));
  assert.equal(rows[0].portion.grams, 500);
});

test('attention is only for items carrying no figure at all', async () => {
  const r = await resolveRoutine(routine([item('bread'), item('zzzqqq not a food')]));

  assert.deepEqual(itemsNeedingAttention(r).map((i) => i.rawText), ['zzzqqq not a food']);
  assert.equal(uncertainItems(r).length, 0, 'an assumed portion is not a fault to fix');
});
