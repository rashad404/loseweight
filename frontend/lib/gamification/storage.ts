'use client';

import { loadDay, saveDay, setActionState, type DayRecord } from '../plan/storage.ts';
import type { WeeklyPlan } from '../routine/models.ts';
import { buildQuest, evaluateAchievements, isoDay, updateQuest } from './engine.ts';
import type { GamificationState } from './models.ts';

export const GAME_KEY = 'lw_game_v2';
export const LEGACY_GAME_KEY = 'lw_game_v1';
export const GAME_CHANGED = 'lw:game-changed';

export function createLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function initialState(plan: WeeklyPlan | null, date = isoDay()): GamificationState {
  return { version: 2, quest: buildQuest(plan, new Date(`${date}T12:00:00Z`)), achievements: [], preferences: { enabled: true, celebrations: true, landscape: true, mode: 'loss', theme: 'mint' }, circle: null, sync: { deviceId: typeof window === 'undefined' ? `device-${date}` : createLocalId(), revision: 0, updatedAt: new Date().toISOString() }, lastVisit: null };
}

function migrateLegacy(plan: WeeklyPlan | null, date: string): GamificationState | null {
  try {
    const raw = localStorage.getItem(LEGACY_GAME_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw) as Omit<GamificationState, 'version'> & { version: 1; actions?: { date: string; id: string; state: string; rescheduledTo?: string | null }[] };
    for (const action of legacy.actions ?? []) {
      const changeId = action.id.split(':').slice(1).join(':');
      if (!changeId || action.state === 'available') continue;
      const current = loadDay(action.date);
      saveDay(setActionState(current, changeId, action.state as Parameters<typeof setActionState>[2], { rescheduledTo: action.rescheduledTo ?? null }));
    }
    const next = { ...initialState(plan, date), preferences: legacy.preferences, achievements: legacy.achievements, circle: legacy.circle, sync: legacy.sync, lastVisit: legacy.lastVisit };
    localStorage.removeItem(LEGACY_GAME_KEY);
    return next;
  } catch { return null; }
}

export function loadGame(plan: WeeklyPlan | null, date = isoDay()): GamificationState {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    const parsed = raw ? JSON.parse(raw) as GamificationState : migrateLegacy(plan, date) ?? initialState(plan, date);
    const defaults = initialState(plan, date);
    parsed.preferences = { ...defaults.preferences, ...parsed.preferences };
    parsed.circle ??= null;
    parsed.sync ??= defaults.sync;
    if (parsed.quest.weekStart !== defaults.quest.weekStart || !plan?.changes.some((change) => change.id === parsed.quest.sourceChangeId && change.accepted)) parsed.quest = defaults.quest;
    return parsed;
  } catch { return initialState(plan, date); }
}

export function saveGame(state: GamificationState, days: DayRecord[], plan: WeeklyPlan | null): GamificationState | null {
  try {
    const quest = updateQuest(state.quest, days);
    const withQuest = { ...state, quest, lastVisit: isoDay(), sync: { ...state.sync, updatedAt: new Date().toISOString() } };
    const next = { ...withQuest, achievements: evaluateAchievements(withQuest, days, plan) };
    localStorage.setItem(GAME_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(GAME_CHANGED));
    return next;
  } catch { return null; }
}

export function exportGame(state: GamificationState, days: DayRecord[]): string {
  return JSON.stringify({ schema: 'loseweight-progress', version: 2, exportedAt: new Date().toISOString(), state, days: days.slice(-31) }, null, 2);
}

export function importGame(raw: string): { state: GamificationState; days: DayRecord[] } | null {
  try {
    const payload = JSON.parse(raw) as { schema?: string; version?: number; state?: GamificationState; days?: DayRecord[] };
    return payload.schema === 'loseweight-progress' && payload.version === 2 && payload.state?.version === 2 && Array.isArray(payload.days) ? { state: payload.state, days: payload.days.slice(-31) } : null;
  } catch { return null; }
}
