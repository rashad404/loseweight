import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  screen, screenTopics, clampIntake, SAFETY_LIMITS,
} from '../lib/safety/boundaries.ts';

const base = {
  age: 35, pregnantOrBreastfeeding: false,
  eatingDisorderHistory: false, clinicianDirectedDiet: false,
};

test('an ordinary adult is eligible for a personalized plan', () => {
  const r = screen(base);
  assert.equal(r.eligible, true);
  assert.deepEqual(r.exclusions, []);
});

test('minors are excluded', () => {
  const r = screen({ ...base, age: 16 });
  assert.equal(r.eligible, false);
  assert.ok(r.exclusions.includes('minor'));
});

test('pregnancy and breastfeeding are excluded', () => {
  assert.equal(screen({ ...base, pregnantOrBreastfeeding: true }).eligible, false);
});

test('eating disorder history is excluded', () => {
  const r = screen({ ...base, eatingDisorderHistory: true });
  assert.equal(r.eligible, false);
  assert.ok(r.exclusions.includes('eating-disorder'));
});

test('a clinician-directed diet is excluded', () => {
  assert.equal(screen({ ...base, clinicianDirectedDiet: true }).eligible, false);
});

test('multiple exclusions are all reported', () => {
  const r = screen({ age: 15, pregnantOrBreastfeeding: true, eatingDisorderHistory: true, clinicianDirectedDiet: false });
  assert.equal(r.exclusions.length, 3);
});

test('medication questions are refused', () => {
  for (const q of [
    'should I take ozempic',
    'which medication is best for weight loss',
    'can you prescribe something',
    'how much semaglutide should I use',
  ]) {
    assert.equal(screenTopics(q).allowed, false, q);
  }
});

test('diagnosis questions are refused', () => {
  assert.equal(screenTopics('do I have insulin resistance').allowed, false);
  assert.equal(screenTopics('is this pcos').allowed, false);
});

test('emergencies are flagged urgent, not merely refused', () => {
  const r = screenTopics('I have chest pain and cannot breathe');
  assert.equal(r.allowed, false);
  assert.equal(r.urgent, true);
});

test('contradicting a clinician is refused', () => {
  assert.equal(screenTopics('my doctor said no carbs but I disagree').allowed, false);
});

test('ordinary food questions are allowed through', () => {
  for (const q of [
    'what can I eat at a pizza place',
    'I am hungry in the afternoon, what should I have',
    'can I swap rice for potatoes',
    'I went off plan yesterday',
  ]) {
    assert.equal(screenTopics(q).allowed, true, q);
  }
});

test('intake is clamped to the deficit cap', () => {
  // Maintenance 2400: a 25% cap floors intake at 1800.
  assert.equal(clampIntake(1200, 2400, 'female'), 1800);
  assert.equal(clampIntake(1900, 2400, 'female'), 1900);
});

test('intake never falls below the sex-specific floor', () => {
  // Maintenance 1400: 25% would allow 1050, below the 1200 floor.
  assert.equal(clampIntake(900, 1400, 'female'), 1200);
  assert.equal(clampIntake(900, 1700, 'male'), 1500);
});

test('safety limits are the values the policy pages describe', () => {
  assert.equal(SAFETY_LIMITS.maxDeficitFraction, 0.25);
  assert.equal(SAFETY_LIMITS.maxSimultaneousChanges, 3);
  assert.equal(SAFETY_LIMITS.minDaysBeforeAdjusting, 21);
});
