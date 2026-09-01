export type PlanMode = 'loss' | 'maintenance' | 'paused';

export interface WeeklyQuest {
  id: string;
  sourceChangeId: string | null;
  target: number;
  progress: number;
  weekStart: string;
  completed: boolean;
}

export interface Achievement {
  id: 'first-check' | 'flexible-plan' | 'welcome-back' | 'steady-week' | 'quest-complete';
  earnedAt: string;
}

export interface GamificationPreferences {
  enabled: boolean;
  celebrations: boolean;
  landscape: boolean;
  mode: PlanMode;
  theme: 'mint' | 'violet' | 'sunrise';
}

export interface CircleMember {
  id: string;
  name: string;
  contribution: number;
  reaction: 'heart' | 'clap' | 'support' | null;
}

export interface SupportCircle {
  id: string;
  name: string;
  collectiveTarget: number;
  members: CircleMember[];
  inviteCode: string;
}

export interface SyncMetadata {
  deviceId: string;
  revision: number;
  updatedAt: string;
}

export interface GamificationState {
  version: 2;
  quest: WeeklyQuest;
  achievements: Achievement[];
  preferences: GamificationPreferences;
  circle: SupportCircle | null;
  sync: SyncMetadata;
  lastVisit: string | null;
}

export interface Consistency {
  completed: number;
  planned: number;
  ratio: number;
  activeDays: number;
}

export interface Progression {
  level: number;
  current: number;
  next: number;
  unlockedThemes: GamificationPreferences['theme'][];
}
