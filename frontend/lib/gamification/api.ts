import { apiClient } from '@/lib/api/client';
import type { GamificationState, SupportCircle } from './models';
import type { DayRecord } from '@/lib/plan/storage';
import { clearGameEvents, pendingGameEvents } from './analytics';

interface ProgressSnapshot { version: 2; game: GamificationState; days: DayRecord[] }
interface ProgressPayload { revision: number; state: ProgressSnapshot; updated_at: string }

export async function pushProgress(state: GamificationState, days: DayRecord[]): Promise<{ state: GamificationState; days: DayRecord[]; conflict: boolean }> {
  try {
    const snapshot: ProgressSnapshot = { version: 2, game: state, days: days.slice(-31) };
    const response = await apiClient.put<{ data: ProgressPayload }>('/progress', { revision: state.sync.revision, state: snapshot });
    return { state: { ...response.data.data.state.game, sync: { ...state.sync, revision: response.data.data.revision, updatedAt: response.data.data.updated_at } }, days: response.data.data.state.days, conflict: false };
  } catch (error: unknown) {
    const candidate = error as { response?: { status?: number; data?: { data?: ProgressPayload } } };
    if (candidate.response?.status === 409 && candidate.response.data?.data) {
      const remote = candidate.response.data.data;
      return { state: { ...remote.state.game, sync: { ...state.sync, revision: remote.revision, updatedAt: remote.updated_at } }, days: remote.state.days, conflict: true };
    }
    throw error;
  }
}

interface ApiCircle {
  id: number; name: string; invite_code: string; collective_target: number;
  members: { id: number; display_name: string; contribution: number; reaction: 'heart' | 'clap' | 'support' | null }[];
}

const mapCircle = (circle: ApiCircle): SupportCircle => ({
  id: String(circle.id), name: circle.name, inviteCode: circle.invite_code,
  collectiveTarget: circle.collective_target,
  members: circle.members.map((member) => ({ id: String(member.id), name: member.display_name, contribution: member.contribution, reaction: member.reaction })),
});

export async function createRemoteCircle(name: string, displayName: string): Promise<SupportCircle> {
  const response = await apiClient.post<{ data: ApiCircle }>('/circles', { name, display_name: displayName, collective_target: 20 });
  return mapCircle(response.data.data);
}

export async function joinRemoteCircle(inviteCode: string, displayName: string): Promise<SupportCircle> {
  const response = await apiClient.post<{ data: ApiCircle }>('/circles/join', { invite_code: inviteCode, display_name: displayName });
  return mapCircle(response.data.data);
}

export async function updateRemoteContribution(circleId: string, contribution: number): Promise<SupportCircle> {
  const response = await apiClient.put<{ data: ApiCircle }>(`/circles/${circleId}/contribution`, { contribution });
  return mapCircle(response.data.data);
}

export async function sendRemoteReaction(circleId: string, memberId: string): Promise<SupportCircle> {
  const response = await apiClient.post<{ data: ApiCircle }>(`/circles/${circleId}/reaction`, { member_id: Number(memberId), reaction: 'heart' });
  return mapCircle(response.data.data);
}

export async function flushGameEvents(): Promise<number> {
  const events = pendingGameEvents();
  if (!events.length) return 0;
  await apiClient.post('/progress/events', { events });
  clearGameEvents();
  return events.length;
}
