'use client';

import { buildInitialActions, buildQuest, evaluateAchievements, isoDay, updateQuest } from './engine.ts';
import type { ActionState, GamificationState } from './models.ts';

export const GAME_KEY = 'lw_game_v1';
export const GAME_CHANGED = 'lw:game-changed';

export function initialState(date = isoDay()): GamificationState {
  const deviceId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `device-${date}`;
  return {
    version: 1, actions: buildInitialActions(date), quest: buildQuest(new Date(`${date}T12:00:00Z`)), achievements: [],
    preferences: { enabled: true, celebrations: true, landscape: true, mode: 'loss', theme: 'mint' },
    circle: null, sync: { deviceId, revision: 0, updatedAt: new Date().toISOString() }, lastVisit: null,
  };
}

export function loadGame(date = isoDay()): GamificationState {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    const parsed = raw ? JSON.parse(raw) as GamificationState : initialState(date);
    const defaults = initialState(date);
    parsed.preferences = { ...defaults.preferences, ...parsed.preferences };
    parsed.circle ??= null;
    parsed.sync ??= defaults.sync;
    if (!parsed.actions.some((a) => a.date === date) && parsed.preferences.mode !== 'paused') {
      parsed.actions.push(...buildInitialActions(date));
    }
    return parsed;
  } catch { return initialState(date); }
}

export function prepareGame(state: GamificationState): GamificationState {
  const quest = updateQuest(state.quest, state.actions);
  const next = { ...state, quest, achievements: evaluateAchievements({ ...state, quest }), lastVisit: isoDay() };
  return { ...next, sync: { ...next.sync, updatedAt: new Date().toISOString() } };
}

export function saveGame(state: GamificationState): GamificationState | null {
  try {
    const next = prepareGame(state);
    localStorage.setItem(GAME_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(GAME_CHANGED));
    return next;
  } catch { return null; }
}

export function exportGame(state: GamificationState): string {
  return JSON.stringify({ schema: 'loseweight-progress', exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importGame(raw: string): GamificationState | null {
  try {
    const payload = JSON.parse(raw) as { schema?: string; state?: GamificationState };
    if (payload.schema !== 'loseweight-progress' || payload.state?.version !== 1) return null;
    return payload.state;
  } catch { return null; }
}

export function transitionAction(state: GamificationState, id: string, actionState: ActionState, replacement?: string): GamificationState {
  return {
    ...state,
    actions: state.actions.map((a) => a.id === id ? {
      ...a, state: actionState,
      title: replacement ?? (actionState === 'adjusted' ? a.easierTitle : a.title),
      completedAt: actionState === 'completed' || actionState === 'adjusted' ? new Date().toISOString() : null,
    } : a),
  };
}

export function rescheduleAction(state: GamificationState, id: string, nextDate: string): GamificationState {
  const source = state.actions.find((a) => a.id === id);
  if (!source || state.actions.some((a) => a.id === `${nextDate}:${source.id.split(':').at(-1)}`)) return state;
  const moved = { ...source, id: `${nextDate}:${source.id.split(':').at(-1)}`, date: nextDate, state: 'available' as const, rescheduledTo: null, completedAt: null };
  return {
    ...state,
    actions: [...state.actions.map((a) => a.id === id ? { ...a, state: 'rescheduled' as const, rescheduledTo: nextDate, completedAt: null } : a), moved],
  };
}
