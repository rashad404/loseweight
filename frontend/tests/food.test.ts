import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, scale } from '../lib/food/provider.ts';
import { offlineUsdaProvider, createUsdaProvider } from '../lib/food/usda.ts';
import { azerbaijaniProvider, AZ_DISH_COUNT } from '../lib/food/azerbaijani.ts';

// Offline by default: a test that depends on the network, on the API being
// up, or on USDA quota is a test that fails for reasons unrelated to the code.
const providers = [offlineUsdaProvider, azerbaijaniProvider];

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

test('filler words around a known food do not prevent a match', async () => {
  for (const phrase of ['some fresh banana', 'a plain apple', 'the butter']) {
    const [m] = await resolve(providers, { name: phrase });
    assert.notEqual(m.source, 'unmatched', phrase);
  }
});

test('a second food in the phrase is not quietly discarded', async () => {
  // This used to answer "greek yogurt" and drop the honey, which is most of
  // the calories. Two foods are two rows, handled where the routine is built.
  const [m] = await resolve(providers, { name: 'greek yogurt with honey' });

  assert.equal(m.source, 'unmatched', 'no half answer that looks whole');
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

test('a food only the remote source knows is resolved through it', async () => {
  const remote = createUsdaProvider(async (name) => ({
    results: [{ id: '99999', name: `Remote: ${name}`, per100g: { kcal: 200, proteinG: 10, fiberG: 1 } }],
    strong: true,
  }));
  const [m] = await resolve([remote], { name: 'something obscure', grams: 100 });
  assert.equal(m.source, 'usda');
  // A remote match stays medium confidence even with a stated portion, because
  // the food match itself came from a fuzzy search. The band reflects that.
  assert.ok(m.nutrition!.kcalLow < 200 && m.nutrition!.kcalHigh > 200,
    `200 should sit inside ${m.nutrition!.kcalLow}-${m.nutrition!.kcalHigh}`);
  assert.equal(m.confidence, 'medium');
});

test('an ambiguous remote result asks the user instead of picking one', async () => {
  // USDA ranks rice crackers above rice and chocolate syrup above chocolate.
  // When nothing clearly answers the word, guessing produces a calorie figure
  // the user never chose, so the candidates come back uncounted.
  const remote = createUsdaProvider(async () => ({
    results: [
      { id: '1', name: 'Rice crackers', per100g: { kcal: 416, proteinG: 8, fiberG: 3 } },
      { id: '2', name: 'Snacks, rice cakes', per100g: { kcal: 380, proteinG: 8, fiberG: 4 } },
    ],
    strong: false,
  }));
  const [m] = await resolve([remote], { name: 'zzz obscure grain' });

  assert.equal(m.nutrition, null, 'nothing is counted until the user picks');
  assert.equal(m.caveat, 'needsChoice');
  assert.equal(m.alternatives?.length, 2);
  assert.equal(m.alternatives![0].name, 'Rice crackers');
  assert.ok(m.alternatives!.every((a) => a.nutrition), 'each candidate carries its own figure');
});

test('a plain word resolves from the curated table, not the remote search', async () => {
  // "rice" reaching USDA came back as rice crackers at 416 kcal per 100 g.
  // The alias has to catch it before the network is involved at all.
  let calls = 0;
  const remote = createUsdaProvider(async () => { calls++; return { results: [], strong: false }; });

  for (const [word, expected] of [
    ['rice', 'Rice, white, long-grain, cooked'],
    ['bread', 'Bread, white, commercially prepared'],
    ['chicken', 'Chicken, meat only, cooked, roasted'],
    ['coke', 'Beverages, carbonated, cola, regular'],
    ['coffee', 'Coffee, brewed'],
  ] as const) {
    const [m] = await resolve([remote], { name: word });
    assert.equal(m.name, expected, word);
  }

  assert.equal(calls, 0, 'common words must never cost a network call');
});

test('a qualifier is never dropped to force a curated match', async () => {
  // Asked to name the form of a food, the model returns "white brined cheese"
  // for pendir. Matching the bare word "cheese" inside it answered with
  // cheddar at 403 kcal per 100 g, losing the part that changes the number.
  let searched: string[] = [];
  const remote = createUsdaProvider(async (name) => {
    searched.push(name);
    return { results: [], strong: false };
  });

  const [m] = await resolve([remote], { name: 'white brined cheese' });

  assert.equal(m.source, 'unmatched', 'better to ask than to answer cheddar');
  assert.deepEqual(searched, ['white brined cheese'], 'the whole phrase is searched');
});

test('a qualifier the curated record already describes is still a match', async () => {
  // The check is that nothing meaningful is unaccounted for, not that the
  // wording is identical, so naming the form does not cost a lookup.
  const offline = createUsdaProvider(async () => ({ results: [], strong: false }));

  for (const [query, expected] of [
    ['cooked white rice', 'Rice, white, long-grain, cooked'],
    ['brewed coffee', 'Coffee, brewed'],
    ['black tea', 'Tea, black, brewed'],
  ] as const) {
    const [m] = await resolve([offline], { name: query });
    assert.equal(m.name, expected, query);
  }
});

test('a dish ingredient takes the best match instead of asking', async () => {
  // Asking someone to pick a USDA record for the onion inside their plov is
  // the wrong question, and refusing to price it made the dish understate
  // itself. The composition lists every record it used, so the choice is still
  // visible without becoming a prompt.
  const remote = createUsdaProvider(async () => ({
    results: [{ id: '1', name: 'Onions, cooked, boiled', per100g: { kcal: 42, proteinG: 1, fiberG: 1 } }],
    strong: false,
  }));

  const asked = await resolve([remote], { name: 'onion, cooked' });
  assert.equal(asked[0].nutrition, null, 'on its own it still asks');

  const [used] = await resolve([remote], { name: 'onion, cooked', grams: 100, acceptBest: true });
  assert.equal(used.name, 'Onions, cooked, boiled');
  assert.ok(used.nutrition, 'inside a recipe it is priced');
});

test('a longer alias wins over a shorter one it contains', async () => {
  const offline = createUsdaProvider(async () => ({ results: [], strong: false }));
  const [m] = await resolve([offline], { name: 'chicken breast' });
  assert.equal(m.name, 'Chicken, meat only, cooked, roasted');
});

test('a remote lookup that fails degrades to unmatched, not to a guess', async () => {
  const broken = createUsdaProvider(async () => { throw new Error('network'); });
  const [m] = await resolve([broken], { name: 'zzzz not a food' });
  assert.equal(m.source, 'unmatched');
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
