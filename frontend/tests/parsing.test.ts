import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoutineDeterministic, parseCacheKey } from '../lib/ai/parse-routine.ts';

const slots = (t: string) => parseRoutineDeterministic(t).meals.map((m) => m.slot);
const items = (t: string, slot: string) =>
  parseRoutineDeterministic(t).meals.find((m) => m.slot === slot)?.items.map((i) => i.text) ?? [];

test('a plain English day parses into meals', () => {
  const text = 'Breakfast is toast and coffee. For lunch I have chicken and rice. Dinner is pasta.';
  assert.deepEqual(slots(text), ['breakfast', 'lunch', 'dinner']);
  assert.deepEqual(items(text, 'lunch'), ['chicken', 'rice']);
});

test('filler words are stripped from item names', () => {
  const text = 'For breakfast I usually have some toast and a banana.';
  assert.deepEqual(items(text, 'breakfast'), ['toast', 'banana']);
});

test('stated quantities are captured, absent ones stay null', () => {
  const r = parseRoutineDeterministic('Lunch is 200g chicken and rice.');
  const [chicken, rice] = r.meals[0].items;
  assert.equal(chicken.quantity, 200);
  assert.equal(chicken.unit, 'g');
  assert.equal(rice.quantity, null, 'an unstated portion must not be invented');
});

test('household measures are preserved for the correction UI', () => {
  const r = parseRoutineDeterministic('Dinner is a bowl of plov.');
  assert.ok(r.meals[0].items[0].household, 'should keep "a bowl"');
});

test('Azerbaijani dishes and meal words parse', () => {
  const text = 'Səhər yeməyi pendir və lavaş. Nahar plov. Axşam dovga.';
  const s = slots(text);
  assert.ok(s.includes('breakfast') && s.includes('lunch') && s.includes('dinner'), `got ${s}`);
  assert.deepEqual(items(text, 'breakfast'), ['pendir', 'lavaş']);
});

test('Russian meal words parse', () => {
  const s = slots('Завтрак яйца. Обед курица. Ужин рис.');
  assert.ok(s.includes('breakfast') && s.includes('lunch') && s.includes('dinner'), `got ${s}`);
});

test('non-negotiable foods are extracted, not treated as a meal', () => {
  const r = parseRoutineDeterministic('Dinner is chicken. I will not give up my evening tea and chocolate.');
  assert.ok(r.nonNegotiables.length >= 1, 'should capture at least one');
  assert.ok(r.nonNegotiables.some((n) => /tea/i.test(n)));
  assert.ok(!r.meals.some((m) => m.items.some((i) => /will not give up/i.test(i.text))));
});

test('drinks are their own slot', () => {
  assert.ok(slots('I drink cola and coffee during the day.').includes('drink'));
});

test('text with no recognisable meal produces nothing rather than guessing', () => {
  const r = parseRoutineDeterministic('I want to lose weight before summer.');
  assert.equal(r.meals.length, 0);
});

test('a stated time is kept verbatim and never invented', () => {
  const withTime = parseRoutineDeterministic('Breakfast at 7am is eggs.');
  assert.match(withTime.meals[0].whenDescribed ?? '', /7\s*am/i);
  const without = parseRoutineDeterministic('Breakfast is eggs.');
  assert.equal(without.meals[0].whenDescribed, null);
});

test('repeated mentions of one meal merge instead of duplicating', () => {
  const r = parseRoutineDeterministic('Breakfast is eggs. Breakfast also has toast.');
  assert.equal(r.meals.filter((m) => m.slot === 'breakfast').length, 1);
});

test('a comma splits items even when a letter precedes it', () => {
  // Regression: the unicode word boundary rejected a letter before the comma,
  // so "2 eggs, 30g cheese" stayed one unmatchable item.
  const r = parseRoutineDeterministic('breakfast: 2 eggs, 30g cheese');
  const texts = r.meals[0].items.map((i) => i.text);
  assert.equal(texts.length, 2, `got ${JSON.stringify(texts)}`);
  assert.match(texts[0], /eggs/);
  assert.match(texts[1], /cheese/);
});

test('trailing filler is stripped from item names', () => {
  // Regression: removing the slot word from "coffee for breakfast" left
  // "coffee for".
  const r = parseRoutineDeterministic('I have coffee for breakfast');
  assert.deepEqual(r.meals[0].items.map((i) => i.text), ['coffee']);
});

test('a time expression does not end up inside the food name', () => {
  const r = parseRoutineDeterministic('lunch around 1pm - a bowl of soup and bread');
  const texts = r.meals[0].items.map((i) => i.text);
  assert.ok(!texts.some((t) => /1pm/.test(t)), `time leaked into ${JSON.stringify(texts)}`);
  assert.match(r.meals[0].whenDescribed ?? '', /1pm/);
});

test('a fragment that is only filler is not treated as a food', () => {
  const r = parseRoutineDeterministic('Ужин суп. Пью.');
  const drink = r.meals.find((m) => m.slot === 'drink');
  assert.ok(!drink || drink.items.every((i) => i.text !== 'Пью'));
});

test('the cache key ignores case and spacing but not content', () => {
  assert.equal(parseCacheKey('  Eggs   and toast '), parseCacheKey('eggs and toast'));
  assert.notEqual(parseCacheKey('eggs and toast'), parseCacheKey('eggs and rice'));
});
