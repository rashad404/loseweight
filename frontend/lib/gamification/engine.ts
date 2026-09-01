import type { DayRecord } from '../plan/storage.ts';
import type { WeeklyPlan } from '../routine/models.ts';
import type { Achievement, Consistency, GamificationState, Progression, WeeklyQuest } from './models.ts';

export const isoDay = (date = new Date()) => date.toISOString().slice(0, 10);

export function startOfWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return isoDay(d);
}

export function buildQuest(plan: WeeklyPlan | null, date = new Date()): WeeklyQuest {
  return { id: `quest:${startOfWeek(date)}`, sourceChangeId: plan?.changes.find((change) => change.accepted)?.id ?? null, target: 3, progress: 0, weekStart: startOfWeek(date), completed: false };
}

export function calculateConsistency(days: DayRecord[], plan: WeeklyPlan | null, end = new Date()): Consistency {
  if (!plan) return { completed: 0, planned: 0, ratio: 0, activeDays: 0 };
  const accepted = plan.changes.filter((change) => change.accepted).slice(0, 3);
  const endTime = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const startTime = endTime - 6 * 86_400_000;
  let completed = 0;
  let planned = 0;
  const active = new Set<string>();
  for (const day of days) {
    const time = Date.parse(`${day.date}T00:00:00Z`);
    if (time < startTime || time > endTime) continue;
    const states = day.actions ?? {};
    if (Object.keys(states).length === 0 && day.followed.length + day.skipped.length === 0) continue;
    for (const change of accepted) {
      const state = states[change.id]?.state ?? (day.followed.includes(change.id) ? 'completed' : day.skipped.includes(change.id) ? 'skipped' : 'available');
      if (state === 'rescheduled' || state === 'skipped_reasonable') continue;
      planned++;
      if (state === 'completed' || state === 'adjusted') { completed++; active.add(day.date); }
    }
  }
  return { completed, planned, ratio: planned ? completed / planned : 0, activeDays: active.size };
}

export function updateQuest(quest: WeeklyQuest, days: DayRecord[]): WeeklyQuest {
  if (!quest.sourceChangeId) return { ...quest, progress: 0, completed: false };
  const completedDays = new Set(days.filter((day) => {
    if (day.date < quest.weekStart) return false;
    const state = day.actions?.[quest.sourceChangeId!]?.state;
    return state === 'completed' || state === 'adjusted' || day.followed.includes(quest.sourceChangeId!);
  }).map((day) => day.date));
  const progress = Math.min(completedDays.size, quest.target);
  return { ...quest, progress, completed: progress >= quest.target };
}

export function evaluateAchievements(state: GamificationState, days: DayRecord[], plan: WeeklyPlan | null, now = new Date()): Achievement[] {
  const earned = new Map(state.achievements.map((achievement) => [achievement.id, achievement]));
  const add = (id: Achievement['id']) => { if (!earned.has(id)) earned.set(id, { id, earnedAt: now.toISOString() }); };
  const states = days.flatMap((day) => Object.values(day.actions ?? {}).map((action) => action.state));
  if (states.includes('completed') || days.some((day) => day.followed.length > 0)) add('first-check');
  if (states.includes('adjusted')) add('flexible-plan');
  if (state.quest.completed) add('quest-complete');
  if (calculateConsistency(days, plan, now).activeDays >= 5) add('steady-week');
  if (state.lastVisit && Date.parse(isoDay(now)) - Date.parse(state.lastVisit) >= 7 * 86_400_000) add('welcome-back');
  return [...earned.values()];
}

/** Cosmetic progression only. Health outcomes never enter this calculation. */
export function calculateProgression(state: GamificationState, days: DayRecord[]): Progression {
  const current = days.reduce((total, day) => total + Object.values(day.actions ?? {}).filter((action) => action.state === 'completed' || action.state === 'adjusted').length, 0);
  const level = current >= 30 ? 4 : current >= 15 ? 3 : current >= 5 ? 2 : 1;
  return { level, current, next: [0, 5, 15, 30, 50][level], unlockedThemes: level >= 3 ? ['mint', 'violet', 'sunrise'] : level >= 2 ? ['mint', 'violet'] : ['mint'] };
}
