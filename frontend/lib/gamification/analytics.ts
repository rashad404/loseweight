export type GameEventName =
  | 'today_viewed' | 'action_completed' | 'action_adjusted' | 'action_rescheduled'
  | 'action_skipped' | 'action_skipped_reasonable' | 'quest_completed'
  | 'circle_created' | 'encouragement_sent' | 'gamification_disabled';

export interface GameEvent {
  name: GameEventName;
  at: string;
  properties: Record<string, string | number | boolean>;
}

const EVENT_KEY = 'lw_game_events_v1';
const allowedProperties = new Set(['sourceType', 'actionState', 'mode', 'achievementId', 'circleSize']);

/** Local queue only. It deliberately rejects free text and health measurements. */
export function recordGameEvent(name: GameEventName, properties: Record<string, unknown> = {}): void {
  try {
    const safe: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (allowedProperties.has(key) && ['string', 'number', 'boolean'].includes(typeof value)) {
        safe[key] = value as string | number | boolean;
      }
    }
    const existing = JSON.parse(localStorage.getItem(EVENT_KEY) ?? '[]') as GameEvent[];
    const next = [...existing.slice(-199), { name, at: new Date().toISOString(), properties: safe }];
    localStorage.setItem(EVENT_KEY, JSON.stringify(next));
  } catch { /* Analytics can never block the product. */ }
}

export function pendingGameEvents(): GameEvent[] {
  try { return JSON.parse(localStorage.getItem(EVENT_KEY) ?? '[]') as GameEvent[]; } catch { return []; }
}

export function clearGameEvents(): void {
  try { localStorage.removeItem(EVENT_KEY); } catch { /* Nothing to clear. */ }
}
