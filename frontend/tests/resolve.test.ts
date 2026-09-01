import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoutine, itemsNeedingAttention, uncertainItems } from '../lib/routine/resolve.ts';
import type { ParsedDish, ParsedItem, ParsedRoutine } from '../lib/ai/parse-routine.ts';

const routine = (items: ParsedItem[], dishes: ParsedDish[] = []): ParsedRoutine => ({
  meals: [{ slot: 'breakfast', whenDescribed: null, items }],
  dishes,
  nonNegotiables: [],
});

const item = (
  text: string,
  quantity: number | null = null,
  unit: string | null = null,
  over: Partial<ParsedItem> = {},
): ParsedItem => ({
  text, canonical: null, preparation: null, confidence: 0.9,
  quantity, unit, household: null, dish: null, ...over,
});

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
    item('bread with butter', 2, 'slices', { household: 'two slices' }),
  ])));

  assert.equal(rows[0].portion.grams, 60, 'two slices of bread');
  assert.equal(rows[1].portion.grams, null);
  assert.equal(rows[1].portion.household, null, 'the butter is not measured in slices');
});

test('a phrase the model already named is not split again', async () => {
  // The model returns "pasta with olive oil" named as cooked pasta, and lists
  // the oil separately. Splitting anyway gave the oil half the canonical
  // "cooked pasta", so a phantom 240-325 kcal of pasta appeared beside the
  // real oil.
  const rows = flat(await resolveRoutine(routine([
    item('pasta with olive oil', null, null, { canonical: 'cooked pasta' }),
    item('olive oil', null, null, { canonical: 'olive oil' }),
  ])));

  assert.equal(rows.length, 2, 'two items in, two items out');
  assert.equal(rows[0].match!.name, 'Pasta, cooked');
  assert.equal(rows[1].match!.name, 'Oil, olive, salad or cooking');
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

/* ------------------------------------------------------- composite dishes -- */

const plov = (over: Partial<ParsedDish> = {}): ParsedDish => ({
  dish: 'plov',
  recipeId: 7,
  state: 'generated',
  variant: 'meat plov',
  preparation: null,
  servingG: 300,
  ingredients: [
    { food: 'white rice', gramsLow: 150, gramsHigh: 150 },
    { food: 'butter', gramsLow: 20, gramsHigh: 20 },
  ],
  assumptions: ['The cooking fat was not stated.'],
  ...over,
});

test('a dish is priced from its ingredients, not guessed as a whole', async () => {
  const rows = flat(await resolveRoutine(
    routine([item('plov', null, null, { dish: 'plov' })], [plov()]),
  ));

  // 150 g cooked white rice at 130 kcal/100 g plus 20 g butter at 717.
  const expected = Math.round(1.5 * 130 + 0.2 * 717);
  assert.equal(rows[0].match!.nutrition!.kcalLow, expected);
  assert.equal(rows[0].match!.source, 'recipe');
  assert.equal(rows[0].rawText, 'plov', "the person's own word is kept");
});

test('a proposed composition is carried through as a proposal', async () => {
  const rows = flat(await resolveRoutine(
    routine([item('plov', null, null, { dish: 'plov' })], [plov()]),
  ));
  const recipe = rows[0].match!.recipe!;

  assert.equal(recipe.state, 'generated', 'the UI has to know this was not reviewed');
  assert.equal(recipe.id, 7);
  assert.deepEqual(recipe.assumptions, ['The cooking fat was not stated.']);
  assert.equal(rows[0].match!.confidence, 'low');
  assert.equal(rows[0].match!.caveat, 'mixedDish');
});

test('an ingredient nothing can price is reported, not silently dropped', async () => {
  const rows = flat(await resolveRoutine(routine(
    [item('plov', null, null, { dish: 'plov' })],
    [plov({ ingredients: [
      { food: 'white rice', gramsLow: 150, gramsHigh: 150 },
      { food: 'zzzqqq unknown', gramsLow: 50, gramsHigh: 50 },
    ] })],
  )));

  // The total is an understatement, so the missing part is named.
  assert.deepEqual(rows[0].match!.recipe!.missing, ['zzzqqq unknown']);
  assert.equal(rows[0].match!.nutrition!.kcalLow, Math.round(1.5 * 130));
});

test('a stated weight rescales the whole dish', async () => {
  const full = flat(await resolveRoutine(
    routine([item('plov', null, null, { dish: 'plov' })], [plov()]),
  ));
  const half = flat(await resolveRoutine(
    routine([item('plov', 150, 'g', { dish: 'plov' })], [plov()]),
  ));

  assert.ok(
    Math.abs(half[0].match!.nutrition!.kcalLow - full[0].match!.nutrition!.kcalLow / 2) <= 1,
    'half a serving is half the dish',
  );
});

test('the canonical name is looked up, not the untranslated words', async () => {
  // "yağ" is in no food table. The model resolving it to butter in context is
  // the whole reason this field exists.
  const rows = flat(await resolveRoutine(routine([
    item('yağ', null, null, { canonical: 'butter' }),
  ])));

  assert.equal(rows[0].match!.name, 'Butter, salted');
  assert.equal(rows[0].rawText, 'yağ', "the person still sees what they wrote");
});
