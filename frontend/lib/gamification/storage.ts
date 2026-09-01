'use client';

import { buildInitialActions, buildQuest, evaluateAchievements, isoDay, updateQuest } from './engine.ts';
import type { ActionState, GamificationState } from './models.ts';

export const GAME_KEY = 'lw_game_v1';
export const GAME_CHANGED = 'lw:game-changed';

export function initialState(date = isoDay()): GamificationState {
  return {
    version: 1, actions: buildInitialActions(date), quest: buildQuest(new Date(`${date}T12:00:00Z`)), achievements: [],
    preferences: { enabled: true, celebrations: true, landscape: true, mode: 'loss' }, lastVisit: null,
  };
}

export function loadGame(date = isoDay()): GamificationState {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    const parsed = raw ? JSON.parse(raw) as GamificationState : initialState(date);
    if (!parsed.actions.some((a) => a.date === date) && parsed.preferences.mode !== 'paused') {
      parsed.actions.push(...buildInitialActions(date));
    }
    return parsed;
  } catch { return initialState(date); }
}

export function saveGame(state: GamificationState): boolean {
  try {
    const quest = updateQuest(state.quest, state.actions);
    const next = { ...state, quest, achievements: evaluateAchievements({ ...state, quest }), lastVisit: isoDay() };
    localStorage.setItem(GAME_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(GAME_CHANGED));
    return true;
  } catch { return false; }
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
