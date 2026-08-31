import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, scale } from '../lib/food/provider.ts';
import { usdaProvider } from '../lib/food/usda.ts';
import { azerbaijaniProvider, AZ_DISH_COUNT } from '../lib/food/azerbaijani.ts';

const providers = [usdaProvider, azerbaijaniProvider];

test('a common US food resolves from USDA with provenance', async () => {
  const [m] = await resolve(providers, { name: 'chicken breast', grams: 150 });
  assert.equal(m.source, 'usda');
  assert.equal(m.confidence, 'high');
  assert.ok(m.nutrition);
  assert.ok(m.nutrition!.proteinLowG >= 40, `protein was ${m.nutrition!.proteinLowG}`);
});

test('an omitted portion lowers confidence and flags the assumption', async () => {
  const [m] = await resolve(providers, { name: 'white rice' });
  assert.equal(m.confidence, 'medium');
  assert.equal(m.caveat, 'assumedPortion');
  assert.ok(m.nutrition!.kcalHigh > m.nutrition!.kcalLow, 'range should widen');
});

test('an Azerbaijani mixed dish returns a range, never a single value', async () => {
  const [m] = await resolve(providers, { name: 'plov' });
  assert.equal(m.source, 'recipe');
  assert.equal(m.confidence, 'low');
  assert.equal(m.caveat, 'mixedDish');
  assert.ok(m.components && m.components.length >= 3, 'should expose ingredients');
  const spread = m.nutrition!.kcalHigh - m.nutrition!.kcalLow;
  assert.ok(spread > 100, `a home serving of plov should span more than 100 kcal, got ${spread}`);
});

test('Azerbaijani spelling variants and diacritics all match', async () => {
  for (const name of ['plov', 'aş', 'pilaf', 'PLOV', 'düşbərə', 'dusbara', 'qutab', 'gutab']) {
    const [m] = await resolve(providers, { name });
    assert.notEqual(m.source, 'unmatched', `${name} should match`);
  }
});

test('every curated dish is reachable by at least one alias', async () => {
  const found = new Set<string>();
  for (const name of ['plov','dolma','dushbara','qutab','piti','kebab','dovga','ajabsandal','bozbash','chigirtma','pendir','lavash']) {
    const [m] = await resolve(providers, { name });
    if (m.source !== 'unmatched') found.add(m.name);
  }
  assert.equal(found.size, AZ_DISH_COUNT, `reached ${found.size} of ${AZ_DISH_COUNT} dishes`);
});

test('a short alias never matches inside a longer word', async () => {
  // Regression: "aş" normalises to "as", which is a substring of both
  // "bozbash" and "lavash". Both used to resolve to Plov.
  const [boz] = await resolve(providers, { name: 'bozbash' });
  assert.equal(boz.name, 'Bozbash');
  const [lav] = await resolve(providers, { name: 'lavash' });
  assert.equal(lav.name, 'Bread');
  const [as] = await resolve(providers, { name: 'as' });
  assert.equal(as.name, 'Plov', 'the alias itself must still match on its own');
});

test('an unknown food is reported as unmatched, not guessed', async () => {
  const [m] = await resolve(providers, { name: 'zzzz not a food' });
  assert.equal(m.source, 'unmatched');
  assert.equal(m.nutrition, null);
  assert.equal(m.caveat, 'notFound');
});

test('a misspelling that contains a known food still matches', async () => {
  const [m] = await resolve(providers, { name: 'greek yogurt with honey' });
  assert.notEqual(m.source, 'unmatched');
});

test('portion confidence widens the range predictably', () => {
  const per100 = { kcal: 100, proteinG: 10, fiberG: 2 };
  const high = scale(per100, 100, 'high');
  const low = scale(per100, 100, 'low');
  assert.equal(high.kcalLow, high.kcalHigh, 'a known portion has no band');
  assert.ok(low.kcalLow < low.kcalHigh, 'a guessed portion has a band');
  assert.equal(low.kcalLow, 70);
  assert.equal(low.kcalHigh, 130);
});

test('a provider that throws does not lose other providers matches', async () => {
  const broken = { id: 'usda' as const, async search() { throw new Error('down'); } };
  const [m] = await resolve([broken, azerbaijaniProvider], { name: 'dolma' });
  assert.equal(m.name, 'Dolma');
});

test('results are ordered most confident first', async () => {
  const rank = { high: 0, medium: 1, low: 2 };
  const ms = await resolve(providers, { name: 'bread', grams: 60 });
  for (let i = 1; i < ms.length; i++) {
    assert.ok(rank[ms[i - 1].confidence] <= rank[ms[i].confidence]);
  }
});
