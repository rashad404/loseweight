import type { Achievement, Consistency, DailyAction, GamificationState, Progression, WeeklyQuest } from './models.ts';

export const isoDay = (date = new Date()) => date.toISOString().slice(0, 10);

export function startOfWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return isoDay(d);
}

export function buildInitialActions(date: string): DailyAction[] {
  return [
    {
      id: `${date}:breakfast`, date, title: 'Use your planned breakfast change',
      easierTitle: 'Make one part of breakfast match the plan',
      alternatives: ['Use the protein option', 'Use the portion option'],
      rationale: 'This comes from the routine and change you accepted.',
      sourceType: 'accepted_change', sourceLabel: 'Accepted weekly change', state: 'available',
      rescheduledTo: null, completedAt: null,
    },
    {
      id: `${date}:hunger`, date, title: 'Prepare your planned hunger option',
      easierTitle: 'Choose the hunger option you would use',
      alternatives: ['Prepare a smaller option', 'Move it to your hungriest time'],
      rationale: 'Planning before hunger makes the choice easier to follow.',
      sourceType: 'accepted_change', sourceLabel: 'Accepted weekly change', state: 'available',
      rescheduledTo: null, completedAt: null,
    },
    {
      id: `${date}:review`, date, title: 'Check whether today still feels realistic',
      easierTitle: 'Take a ten-second plan check',
      alternatives: ['Keep the plan', 'Make one action easier'],
      rationale: 'An unrealistic plan should be adjusted, not silently abandoned.',
      sourceType: 'weekly_review', sourceLabel: 'Weekly review', state: 'available',
      rescheduledTo: null, completedAt: null,
    },
  ];
}

export function buildQuest(date = new Date()): WeeklyQuest {
  return {
    id: `quest:${startOfWeek(date)}`, title: 'Use one planned change on three days',
    rationale: 'Repeating one workable change is more useful than adding several difficult ones.',
    target: 3, progress: 0, weekStart: startOfWeek(date), completed: false,
  };
}

export function calculateConsistency(actions: DailyAction[], end = new Date()): Consistency {
  const endTime = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const startTime = endTime - 6 * 86_400_000;
  const eligible = actions.filter((action) => {
    const time = Date.parse(`${action.date}T00:00:00Z`);
    return time >= startTime && time <= endTime && action.state !== 'skipped_reasonable' && action.state !== 'rescheduled';
  });
  const earned = eligible.filter((a) => a.state === 'completed' || a.state === 'adjusted');
  return {
    completed: earned.length,
    planned: eligible.length,
    ratio: eligible.length ? earned.length / eligible.length : 0,
    activeDays: new Set(earned.map((a) => a.date)).size,
  };
}

export function updateQuest(quest: WeeklyQuest, actions: DailyAction[]): WeeklyQuest {
  const days = new Set(actions.filter((a) =>
    a.date >= quest.weekStart && (a.state === 'completed' || a.state === 'adjusted') && a.sourceType === 'accepted_change',
  ).map((a) => a.date));
  const progress = Math.min(days.size, quest.target);
  return { ...quest, progress, completed: progress >= quest.target };
}

export function evaluateAchievements(state: GamificationState, now = new Date()): Achievement[] {
  const earned = new Map(state.achievements.map((a) => [a.id, a]));
  const add = (id: Achievement['id']) => { if (!earned.has(id)) earned.set(id, { id, earnedAt: now.toISOString() }); };
  if (state.actions.some((a) => a.state === 'completed')) add('first-check');
  if (state.actions.some((a) => a.state === 'adjusted')) add('flexible-plan');
  if (state.quest.completed) add('quest-complete');
  const consistency = calculateConsistency(state.actions, now);
  if (consistency.activeDays >= 5) add('steady-week');
  if (state.lastVisit && Date.parse(isoDay(now)) - Date.parse(state.lastVisit) >= 7 * 86_400_000) add('welcome-back');
  return [...earned.values()];
}

export function specificFeedback(actions: DailyAction[], date: string): string {
  const today = actions.filter((a) => a.date === date);
  const done = today.filter((a) => a.state === 'completed' || a.state === 'adjusted').length;
  const adjusted = today.filter((a) => a.state === 'adjusted').length;
  if (adjusted) return 'You made the plan easier and kept it workable.';
  if (done === today.length && done > 0) return `All ${done} planned actions are complete.`;
  if (done > 0) return `${done} of ${today.length} planned actions completed today.`;
  return 'Start with the action that feels easiest today.';
}

/** Cosmetic progression only. No health outcome or calorie value enters here. */
export function calculateProgression(state: GamificationState): Progression {
  const earnedActions = state.actions.filter((a) => a.state === 'completed' || a.state === 'adjusted').length;
  const current = earnedActions + state.achievements.length * 2;
  const level = current >= 30 ? 4 : current >= 15 ? 3 : current >= 5 ? 2 : 1;
  return {
    level,
    current,
    next: [0, 5, 15, 30, 50][level],
    unlockedThemes: level >= 3 ? ['mint', 'violet', 'sunrise'] : level >= 2 ? ['mint', 'violet'] : ['mint'],
  };
}
