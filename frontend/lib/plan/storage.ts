'use client';

import type { Sex } from '@/lib/health/calculations';
import type { Units } from '@/lib/health/units';

/**
 * The saved plan is the spine of the product: the planner writes it, the tracker
 * compares real weigh-ins against it, and the plateau analyzer reads both.
 *
 * It lives in localStorage only. There is no account and no sync, and the UI
 * says so rather than implying otherwise.
 */
export const PLAN_KEY = 'lw_plan_v1';
export const ENTRIES_KEY = 'lw_entries_v1';
/**
 * Inputs handed from the homepage quick start to the full planner. Kept in
 * storage rather than the URL so body measurements never appear in a query
 * string, browser history, or a referrer header.
 */
export const DRAFT_KEY = 'lw_draft_v1';
/** The confirmed routine from onboarding. */
export const ROUTINE_KEY = 'lw_routine_v1';
/** The key the first version of the tracker used, before plans existed. */
const LEGACY_ENTRIES_KEY = 'lw_entries';

export const PLAN_CHANGED = 'lw:plan-changed';
export const ENTRIES_CHANGED = 'lw:entries-changed';

export interface PlanInputs {
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  activityFactor: number;
  rateKgPerWeek: number;
  units: Units;
}

export interface SavedPlan extends PlanInputs {
  version: 1;
  savedAt: string;
  startedOn: string;
  maintenance: number;
  intake: number;
  deficit: number;
  bmr: number;
  proteinLow: number;
  proteinHigh: number;
  fiber: number;
  weeksToGoal: number | null;
  targetDate: string | null;
  /** Sampled projection, one point per week, used to draw the planned line. */
  projection: { week: number; weightKg: number }[];
}

export interface WeightEntry {
  recordedOn: string;
  weightKg: number;
  waistCm?: number | null;
  note?: string | null;
}

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown, event: string): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(event));
    return true;
  } catch {
    // Quota exceeded or storage blocked. The caller surfaces this rather than
    // pretending the save worked.
    return false;
  }
}

export const loadPlan = () => read<SavedPlan>(PLAN_KEY);

export const savePlan = (plan: SavedPlan) => write(PLAN_KEY, plan, PLAN_CHANGED);

export function clearPlan(): void {
  try {
    localStorage.removeItem(PLAN_KEY);
    window.dispatchEvent(new Event(PLAN_CHANGED));
  } catch {
    // Nothing to do: the plan is already unreachable.
  }
}

export function loadEntries(): WeightEntry[] {
  const current = read<WeightEntry[]>(ENTRIES_KEY);
  if (current) return current;

  // Migrate the pre-plan format, which used snake_case keys.
  const legacy = read<{ recorded_on: string; weight_kg: number; waist_cm?: number | null; note?: string | null }[]>(
    LEGACY_ENTRIES_KEY,
  );
  if (!legacy) return [];

  const migrated = legacy.map((e) => ({
    recordedOn: e.recorded_on,
    weightKg: e.weight_kg,
    waistCm: e.waist_cm ?? null,
    note: e.note ?? null,
  }));
  write(ENTRIES_KEY, migrated, ENTRIES_CHANGED);
  return migrated;
}

export const saveEntries = (entries: WeightEntry[]) =>
  write(ENTRIES_KEY, sortEntries(entries), ENTRIES_CHANGED);

export const sortEntries = (entries: WeightEntry[]) =>
  [...entries].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));

/** One weigh-in per day: a repeat submission corrects that day's number. */
export function upsertEntry(entries: WeightEntry[], entry: WeightEntry): WeightEntry[] {
  return sortEntries([...entries.filter((e) => e.recordedOn !== entry.recordedOn), entry]);
}

export const removeEntry = (entries: WeightEntry[], recordedOn: string) =>
  entries.filter((e) => e.recordedOn !== recordedOn);

/* ---------------------------------------------------------------- CSV ---- */

export function entriesToCsv(entries: WeightEntry[]): string {
  const rows = [['date', 'weight_kg', 'waist_cm', 'note']];
  for (const e of sortEntries(entries)) {
    rows.push([
      e.recordedOn,
      String(e.weightKg),
      e.waistCm != null ? String(e.waistCm) : '',
      e.note ?? '',
    ]);
  }
  return rows
    .map((r) => r.map((cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(','))
    .join('\n');
}

export interface ImportResult {
  entries: WeightEntry[];
  imported: number;
  skipped: number;
}

/**
 * Tolerant CSV import. A backup that fails to restore because of a header or a
 * stray blank line is worse than useless, so unparseable rows are counted and
 * reported rather than aborting the whole import.
 */
export function csvToEntries(csv: string): ImportResult {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
  const entries: WeightEntry[] = [];
  let skipped = 0;

  for (const [i, line] of lines.entries()) {
    const cells = splitCsvLine(line);
    if (i === 0 && /date/i.test(cells[0] ?? '')) continue;

    const date = (cells[0] ?? '').trim();
    const weight = Number.parseFloat((cells[1] ?? '').trim());
    const waist = Number.parseFloat((cells[2] ?? '').trim());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(weight) || weight < 20 || weight > 500) {
      skipped++;
      continue;
    }

    entries.push({
      recordedOn: date,
      weightKg: Math.round(weight * 10) / 10,
      waistCm: Number.isFinite(waist) ? waist : null,
      note: (cells[3] ?? '').trim() || null,
    });
  }

  const deduped = new Map(entries.map((e) => [e.recordedOn, e]));
  return { entries: sortEntries([...deduped.values()]), imported: deduped.size, skipped };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function downloadFile(name: string, contents: string, type = 'text/csv'): void {
  const blob = new Blob([contents], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
