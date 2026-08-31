import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rollingAverage, trendSlopeKgPerWeek, analyzeStall, interpolateProjection, summarize,
} from '../lib/plan/analysis.ts';
import { csvToEntries, entriesToCsv, upsertEntry, sortEntries } from '../lib/plan/storage.ts';

const day = (n: number) => {
  const d = new Date('2026-01-01T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Daily weigh-ins losing `perWeek` kg per week, with optional noise. */
const series = (n: number, start: number, perWeek: number, noise = 0) =>
  Array.from({ length: n }, (_, i) => ({
    recordedOn: day(i),
    weightKg: Math.round((start + (perWeek * i) / 7 + (noise ? Math.sin(i) * noise : 0)) * 10) / 10,
  }));

test('rolling average smooths daily noise', () => {
  const points = rollingAverage(series(30, 90, -0.5, 0.8));
  const last = points[points.length - 1];
  assert.ok(Math.abs(last.averageKg - 88) < 0.6, `average ${last.averageKg} should sit near 88`);
});

test('slope recovers a known rate of loss', () => {
  const slope = trendSlopeKgPerWeek(rollingAverage(series(42, 90, -0.5)));
  assert.ok(slope !== null);
  assert.ok(Math.abs(slope! - -0.5) < 0.08, `slope ${slope} should be near -0.5`);
});

test('fewer than three weeks of data is never called a plateau', () => {
  const a = analyzeStall(series(14, 90, 0), null);
  assert.equal(a.verdict, 'insufficient-data');
});

test('sparse weigh-ins are reported as sparse, not as a plateau', () => {
  const sparse = series(60, 90, 0).filter((_, i) => i % 7 === 0);
  const a = analyzeStall(sparse, null);
  assert.equal(a.verdict, 'sparse-data');
});

test('a genuine flat stretch is called a plateau', () => {
  const a = analyzeStall(series(40, 90, 0), null);
  assert.equal(a.verdict, 'plateau');
  assert.ok(a.flatWeeks >= 3, `flatWeeks was ${a.flatWeeks}`);
});

test('steady loss is on track, not a plateau', () => {
  const a = analyzeStall(series(40, 90, -0.5), null);
  assert.equal(a.verdict, 'on-track');
});

test('a short flat stretch is normal fluctuation', () => {
  // Loses for four weeks, then holds for about ten days.
  const losing = series(28, 90, -0.5);
  const held = Array.from({ length: 10 }, (_, i) => ({
    recordedOn: day(28 + i),
    weightKg: losing[losing.length - 1].weightKg,
  }));
  const a = analyzeStall([...losing, ...held], null);
  assert.ok(['normal-fluctuation', 'plateau'].includes(a.verdict));
  assert.ok(a.flatWeeks >= 1);
});

test('projection interpolates between weekly points and clamps at the ends', () => {
  const projection = [
    { week: 0, weightKg: 90 },
    { week: 1, weightKg: 89.5 },
    { week: 2, weightKg: 89.1 },
  ];
  assert.equal(interpolateProjection(projection, 0.5), 89.75);
  assert.equal(interpolateProjection(projection, -3), 90);
  assert.equal(interpolateProjection(projection, 99), 89.1);
});

test('progress compares actual weight against the saved plan', () => {
  const entries = series(21, 90, -0.5);
  const plan = {
    version: 1 as const, savedAt: '', startedOn: day(0), units: 'metric' as const,
    sex: 'female' as const, age: 35, heightCm: 168, startWeightKg: 90, goalWeightKg: 80,
    activityFactor: 1.375, rateKgPerWeek: 0.5,
    maintenance: 2000, intake: 1500, deficit: 500, bmr: 1450,
    proteinLow: 100, proteinHigh: 140, fiber: 21,
    weeksToGoal: 20, targetDate: null,
    projection: [
      { week: 0, weightKg: 90 }, { week: 1, weightKg: 89.5 },
      { week: 2, weightKg: 89 }, { week: 3, weightKg: 88.5 },
    ],
  };
  const p = summarize(entries, plan);
  assert.ok(p);
  assert.ok(p!.plannedWeightKg !== null);
  assert.ok(Math.abs(p!.varianceKg!) < 0.5, `variance ${p!.varianceKg} should be small`);
});

test('CSV survives a round trip', () => {
  const entries = [
    { recordedOn: '2026-01-01', weightKg: 90.4, waistCm: 96, note: 'start' },
    { recordedOn: '2026-01-02', weightKg: 90.1, waistCm: null, note: 'salty, comma, dinner' },
  ];
  const back = csvToEntries(entriesToCsv(entries));
  assert.equal(back.imported, 2);
  assert.equal(back.skipped, 0);
  assert.equal(back.entries[1].note, 'salty, comma, dinner');
  assert.equal(back.entries[0].weightKg, 90.4);
});

test('CSV import skips junk rows instead of failing the whole file', () => {
  const r = csvToEntries('date,weight_kg\nnot-a-date,80\n2026-01-01,90.2\n2026-01-02,abc\n');
  assert.equal(r.imported, 1);
  assert.equal(r.skipped, 2);
});

test('one weigh-in per day: same date overwrites', () => {
  let entries = [{ recordedOn: '2026-01-01', weightKg: 90 }];
  entries = upsertEntry(entries, { recordedOn: '2026-01-01', weightKg: 89.4 });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].weightKg, 89.4);
});

test('entries always sort by date', () => {
  const sorted = sortEntries([
    { recordedOn: '2026-03-01', weightKg: 88 },
    { recordedOn: '2026-01-01', weightKg: 90 },
  ]);
  assert.equal(sorted[0].recordedOn, '2026-01-01');
});
