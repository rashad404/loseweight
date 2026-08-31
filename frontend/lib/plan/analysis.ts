import type { SavedPlan, WeightEntry } from './storage';

const DAY = 86_400_000;
const days = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

export interface TrendPoint {
  date: string;
  weightKg: number;
  averageKg: number;
}

/**
 * Trailing 7 day mean. Trailing rather than centered because the most recent
 * value is the one people act on, and a centered window cannot produce one.
 */
export function rollingAverage(entries: WeightEntry[]): TrendPoint[] {
  return entries.map((entry) => {
    const end = days(entry.recordedOn);
    const window = entries.filter((e) => {
      const d = days(e.recordedOn);
      return d <= end && d > end - 7 * DAY;
    });
    const mean = window.reduce((sum, e) => sum + e.weightKg, 0) / window.length;
    return {
      date: entry.recordedOn,
      weightKg: entry.weightKg,
      averageKg: Math.round(mean * 100) / 100,
    };
  });
}

/** Least-squares slope in kg per week, or null when there is too little data. */
export function trendSlopeKgPerWeek(points: TrendPoint[]): number | null {
  if (points.length < 3) return null;

  const t0 = days(points[0].date);
  const xs = points.map((p) => (days(p.date) - t0) / (7 * DAY));
  const ys = points.map((p) => p.averageKg);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;

  return Math.round((num / den) * 1000) / 1000;
}

export interface Progress {
  points: TrendPoint[];
  first: TrendPoint;
  latest: TrendPoint;
  spanDays: number;
  changeKg: number;
  change7Kg: number | null;
  change30Kg: number | null;
  slopeKgPerWeek: number | null;
  /** Where the saved plan expected them to be today. */
  plannedWeightKg: number | null;
  varianceKg: number | null;
}

export function summarize(entries: WeightEntry[], plan: SavedPlan | null): Progress | null {
  if (entries.length === 0) return null;

  const points = rollingAverage(entries);
  const first = points[0];
  const latest = points[points.length - 1];
  const spanDays = (days(latest.date) - days(first.date)) / DAY;

  const changeOver = (window: number): number | null => {
    const target = days(latest.date) - window * DAY;
    const past = points.filter((p) => days(p.date) <= target).pop();
    return past ? Math.round((latest.averageKg - past.averageKg) * 100) / 100 : null;
  };

  let plannedWeightKg: number | null = null;
  if (plan) {
    const week = (days(latest.date) - days(plan.startedOn)) / (7 * DAY);
    if (week >= 0 && plan.projection.length > 0) {
      plannedWeightKg = interpolateProjection(plan.projection, week);
    }
  }

  return {
    points,
    first,
    latest,
    spanDays,
    changeKg: Math.round((latest.weightKg - first.weightKg) * 100) / 100,
    change7Kg: changeOver(7),
    change30Kg: changeOver(30),
    slopeKgPerWeek: trendSlopeKgPerWeek(points),
    plannedWeightKg,
    varianceKg:
      plannedWeightKg !== null
        ? Math.round((latest.averageKg - plannedWeightKg) * 100) / 100
        : null,
  };
}

/** Linear interpolation between weekly projection points. */
export function interpolateProjection(
  projection: { week: number; weightKg: number }[],
  week: number,
): number {
  if (week <= projection[0].week) return projection[0].weightKg;
  const last = projection[projection.length - 1];
  if (week >= last.week) return last.weightKg;

  for (let i = 1; i < projection.length; i++) {
    const a = projection[i - 1];
    const b = projection[i];
    if (week <= b.week) {
      const ratio = (week - a.week) / (b.week - a.week || 1);
      return Math.round((a.weightKg + (b.weightKg - a.weightKg) * ratio) * 100) / 100;
    }
  }
  return last.weightKg;
}

export type StallVerdict =
  | 'insufficient-data'
  | 'sparse-data'
  | 'on-track'
  | 'normal-fluctuation'
  | 'slower-than-planned'
  | 'plateau';

export interface StallAnalysis {
  verdict: StallVerdict;
  /** Consecutive trailing weeks whose average has not fallen meaningfully. */
  flatWeeks: number;
  slopeKgPerWeek: number | null;
  observationDays: number;
  entriesPerWeek: number;
}

/**
 * Decides what the data actually shows, instead of asking the user to judge it.
 *
 * Deliberately conservative: it never recommends cutting calories on its own,
 * and it separates "not enough data" and "data too sparse to trust" from a real
 * stall, because acting on noise is the most common way people wreck a plan.
 */
export function analyzeStall(entries: WeightEntry[], plan: SavedPlan | null): StallAnalysis {
  const points = rollingAverage(entries);

  if (points.length < 2) {
    return { verdict: 'insufficient-data', flatWeeks: 0, slopeKgPerWeek: null, observationDays: 0, entriesPerWeek: 0 };
  }

  const observationDays =
    (days(points[points.length - 1].date) - days(points[0].date)) / DAY;
  const entriesPerWeek = observationDays > 0 ? (points.length / observationDays) * 7 : points.length;

  if (observationDays < 21) {
    return { verdict: 'insufficient-data', flatWeeks: 0, slopeKgPerWeek: trendSlopeKgPerWeek(points), observationDays, entriesPerWeek };
  }

  // Fewer than three weigh-ins a week makes a 7 day average unreliable.
  if (entriesPerWeek < 3) {
    return { verdict: 'sparse-data', flatWeeks: 0, slopeKgPerWeek: trendSlopeKgPerWeek(points), observationDays, entriesPerWeek };
  }

  const slope = trendSlopeKgPerWeek(points);
  const latest = points[points.length - 1];

  let flatWeeks = 0;
  for (let w = 1; w <= 8; w++) {
    const target = days(latest.date) - w * 7 * DAY;
    const past = points.filter((p) => days(p.date) <= target).pop();
    if (!past) break;
    // 0.2 kg over the window is inside normal water fluctuation.
    if (past.averageKg - latest.averageKg > 0.2) break;
    flatWeeks = w;
  }

  if (flatWeeks >= 3) {
    return { verdict: 'plateau', flatWeeks, slopeKgPerWeek: slope, observationDays, entriesPerWeek };
  }
  if (flatWeeks > 0) {
    return { verdict: 'normal-fluctuation', flatWeeks, slopeKgPerWeek: slope, observationDays, entriesPerWeek };
  }

  if (plan && slope !== null) {
    const planned = -plan.rateKgPerWeek;
    // Losing, but at less than half the planned rate.
    if (slope > planned / 2) {
      return { verdict: 'slower-than-planned', flatWeeks, slopeKgPerWeek: slope, observationDays, entriesPerWeek };
    }
  }

  return { verdict: 'on-track', flatWeeks, slopeKgPerWeek: slope, observationDays, entriesPerWeek };
}
