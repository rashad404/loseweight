'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Check, ChevronDown, CircleDashed, Copy, Heart, HeartHandshake, Palette, RefreshCw, ShieldCheck, Sparkles, Trophy, Upload } from 'lucide-react';
import ProgressRing from './ProgressRing';
import ProgressLandscape from './ProgressLandscape';
import { calculateConsistency, isoDay } from '@/lib/gamification/engine';
import { exportGame, importGame, initialState, loadGame, rescheduleAction, saveGame, transitionAction } from '@/lib/gamification/storage';
import { recordGameEvent } from '@/lib/gamification/analytics';
import { createRemoteCircle, pushProgress, sendRemoteReaction } from '@/lib/gamification/api';
import type { ActionState, DailyAction, GamificationState, PlanMode, SupportCircle } from '@/lib/gamification/models';
import { gameCopy, type GameLocale } from './copy';

const achievementIds = ['first-check', 'flexible-plan', 'welcome-back', 'steady-week', 'quest-complete'] as const;

export default function TodayDashboard({ locale }: { locale: string }) {
  const c = gameCopy[(locale in gameCopy ? locale : 'en') as GameLocale];
  const date = isoDay();
  const [state, setState] = useState<GamificationState>(() => initialState(date));
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'today' | 'progress' | 'circle' | 'settings'>('today');
  const [open, setOpen] = useState<string | null>(null);
  const [syncText, setSyncText] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => { const id = requestAnimationFrame(() => { setState(loadGame(date)); setReady(true); }); return () => cancelAnimationFrame(id); }, [date]);
  const update = (next: GamificationState) => { const saved = saveGame(next); setState(saved ?? next); };
  const today = state.actions.filter((a) => a.date === date).slice(0, 3);
  const doneToday = today.filter((a) => a.state === 'completed' || a.state === 'adjusted').length;
  const consistency = useMemo(() => calculateConsistency(state.actions), [state.actions]);
  const adjustedToday = today.some((a) => a.state === 'adjusted');
  const feedback = adjustedToday ? c.feedback[2] : doneToday === today.length && doneToday > 0 ? c.feedback[3] : doneToday > 0 ? `${doneToday} ${c.feedback[1]}` : c.feedback[0];
  const changeAction = (a: DailyAction, next: ActionState, replacement?: string) => {
    const event = next === 'completed' ? 'action_completed' : next === 'adjusted' ? 'action_adjusted' : next === 'rescheduled' ? 'action_rescheduled' : next === 'skipped_reasonable' ? 'action_skipped_reasonable' : next === 'skipped' ? 'action_skipped' : null;
    if (event) recordGameEvent(event, { sourceType: a.sourceType, actionState: next, mode: state.preferences.mode });
    update(transitionAction(state, a.id, next, replacement)); setOpen(null);
  };
  const setMode = (mode: PlanMode) => update({ ...state, preferences: { ...state.preferences, mode } });
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoDay(d); })();

  if (!ready) return <div className="panel min-h-96 animate-pulse sunken" aria-label="Loading today" />;

  return (
    <div className="game-shell" data-game-theme={state.preferences.theme}>
      <nav className="game-tabs" aria-label="Today sections">
        {([['today', CircleDashed], ['progress', Trophy], ['circle', HeartHandshake], ['settings', Palette]] as const).map(([id, Icon], index) => (
          <button key={id} data-active={tab === id} onClick={() => setTab(id)}><Icon size={17} />{c.tabs[index]}</button>
        ))}
      </nav>

      {tab === 'today' && <>
        <section className="game-hero">
          <div className="relative z-10 max-w-xl">
            <p className="t-eyebrow !text-white/70">{c.pace}</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] text-white">{doneToday} / {today.length} {c.complete}</h1>
            <p className="mt-3 text-white/75">{feedback}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm text-white">
              <ShieldCheck size={16} /> {state.preferences.mode === 'maintenance' ? c.modes[1] : state.preferences.mode === 'paused' ? c.modes[2] : c.modes[0]}
            </div>
          </div>
          <ProgressLandscape ratio={today.length ? doneToday / today.length : 0} enabled={state.preferences.landscape && state.preferences.enabled} />
        </section>

        {state.preferences.mode === 'paused' ? (
          <section className="game-soft-card text-center py-12"><RefreshCw className="mx-auto text-violet-500" /><h2 className="t-h2 mt-4">{c.pausedTitle}</h2><p className="text-muted mt-2">{c.pausedBody}</p><button className="btn btn-primary mt-5" onClick={() => setMode('maintenance')}>{c.resume}</button></section>
        ) : <section className="space-y-3" aria-labelledby="actions-heading">
          <div className="flex items-end justify-between gap-4"><div><p className="t-eyebrow">{c.today}</p><h2 id="actions-heading" className="t-h2 mt-1">{c.matters}</h2></div><span className="text-sm text-muted">{c.change}</span></div>
          {today.map((action, index) => <article key={action.id} className="game-action" data-state={action.state}>
            <button className="game-check" aria-label={`Mark ${action.title} complete`} onClick={() => changeAction(action, action.state === 'completed' ? 'available' : 'completed')}>
              {action.state === 'completed' || action.state === 'adjusted' ? <Check size={20} /> : <span>{index + 1}</span>}
            </button>
            <div className="min-w-0 flex-1"><h3 className="font-bold leading-snug">{action.state === 'adjusted' ? c.actions[index][1] : c.actions[index][0]}</h3><p className="mt-1 text-sm text-muted">{c.actions[index][2]}</p><p className="mt-2 text-xs font-semibold text-violet-500">{c.actions[index][3]}</p></div>
            <button className="game-more" aria-expanded={open === action.id} onClick={() => setOpen(open === action.id ? null : action.id)} aria-label={`Options for ${action.title}`}><ChevronDown size={19} /></button>
            {open === action.id && <div className="game-action-menu">
              <button onClick={() => changeAction(action, 'adjusted')}>{c.makeEasier}</button>
              {c.alternatives[index].map((alt) => <button key={alt} onClick={() => changeAction(action, 'adjusted', alt)}>{c.replace}: {alt}</button>)}
              <button onClick={() => { update(rescheduleAction(state, action.id, tomorrow)); recordGameEvent('action_rescheduled', { sourceType: action.sourceType, actionState: 'rescheduled', mode: state.preferences.mode }); setOpen(null); }}>{c.move}</button>
              <button onClick={() => changeAction(action, 'skipped_reasonable')}>{c.unsuitable}</button>
              <button onClick={() => changeAction(action, 'skipped')}>{c.skip}</button>
            </div>}
          </article>)}
        </section>}

        {state.preferences.enabled && state.preferences.celebrations && doneToday === today.length && doneToday > 0 && <div className="game-celebration" role="status"><Sparkles size={20} />{feedback}</div>}

        {state.preferences.enabled ? <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="game-soft-card flex items-center gap-5"><ProgressRing completed={consistency.completed} planned={consistency.planned} /><div><p className="t-eyebrow">{c.momentum}</p><h2 className="t-h3 mt-2">{consistency.completed} / {consistency.planned} {c.planned}</h2><p className="text-sm text-muted mt-2">{consistency.activeDays} {c.activeDays}</p></div></div>
          <div className="game-quest"><Sparkles size={20} /><div><p className="text-xs uppercase tracking-wider font-bold opacity-70">{c.quest}</p><h2 className="font-bold mt-1">{c.questTitle}</h2><p className="text-sm opacity-75 mt-1">{state.quest.progress} / {state.quest.target} {c.days}</p><div className="game-quest-bar"><span style={{ width: `${state.quest.progress / state.quest.target * 100}%` }} /></div></div></div>
        </section> : <section className="game-soft-card"><p className="font-semibold">{consistency.completed} / {consistency.planned} {c.planned}</p><p className="text-sm text-muted mt-1">{c.progressOff}</p></section>}
      </>}

      {tab === 'progress' && <section className="space-y-6"><header><p className="t-eyebrow">{c.progressEye}</p><h1 className="t-h1 mt-2">{c.progressTitle}</h1><p className="t-lead mt-3">{c.progressBody}</p></header>{!state.preferences.enabled ? <div className="game-soft-card"><p>{c.progressOff}</p></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{achievementIds.map((id, index) => { const earned = state.achievements.find((a) => a.id === id); const copy = c.achievements[index]; return <article key={id} className={`game-achievement ${earned ? '' : 'opacity-45'}`}><Award size={24} /><h2 className="font-bold mt-4">{copy[0]}</h2><p className="text-sm text-muted mt-1">{copy[1]}</p><p className="text-xs mt-4 font-semibold">{earned ? `${c.earned} ${earned.earnedAt.slice(0, 10)}` : c.available}</p></article>; })}</div>}</section>}

      {tab === 'circle' && <section className="space-y-6"><header><p className="t-eyebrow">{c.circleEye}</p><h1 className="t-h1 mt-2">{c.circleTitle}</h1><p className="t-lead mt-3">{c.circleBody}</p></header>{!state.circle ? <div className="game-circle"><HeartHandshake size={30} /><h2 className="t-h2 mt-4">{c.createTitle}</h2><p className="text-muted mt-2 max-w-xl">{c.createBody}</p><button className="btn btn-primary mt-5" onClick={async () => { let circle: SupportCircle = { id: crypto.randomUUID(), name: c.circleTitle, collectiveTarget: 20, inviteCode: crypto.randomUUID().slice(0, 8).toUpperCase(), members: [{ id: 'me', name: c.today, contribution: consistency.completed, reaction: null }] }; if (localStorage.getItem('lw_token')) { try { circle = await createRemoteCircle(c.circleTitle, c.today); } catch { /* Keep the local circle available offline. */ } } update({ ...state, circle }); recordGameEvent('circle_created', { circleSize: 1 }); }}>{c.create}</button></div> : <div className="game-circle"><div className="flex flex-wrap justify-between gap-4"><div><p className="t-eyebrow">{c.private}</p><h2 className="t-h2 mt-2">{state.circle.name}</h2></div><button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(state.circle!.inviteCode)}><Copy size={16} />{state.circle.inviteCode}</button></div><p className="mt-6 text-sm text-muted">{c.collective}</p><p className="t-num text-3xl mt-1">{state.circle.members.reduce((sum, m) => sum + m.contribution, 0)} / {state.circle.collectiveTarget}</p><div className="mt-6 grid gap-3">{state.circle.members.map((member) => <div className="flex items-center justify-between rounded-xl sunken p-4" key={member.id}><div><strong>{member.name}</strong><p className="text-sm text-muted">{member.contribution} {c.shared}</p></div><button className="btn btn-ghost" onClick={async () => { let circle: SupportCircle = { ...state.circle!, members: state.circle!.members.map((m) => m.id === member.id ? { ...m, reaction: 'heart' as const } : m) }; if (localStorage.getItem('lw_token') && /^\d+$/.test(circle.id)) { try { circle = await sendRemoteReaction(circle.id, member.id); } catch { /* Preserve optimistic local encouragement. */ } } update({ ...state, circle }); recordGameEvent('encouragement_sent', { circleSize: circle.members.length }); }}><Heart size={16} fill={member.reaction === 'heart' ? 'currentColor' : 'none'} />{c.encourage}</button></div>)}</div></div>}</section>}

      {tab === 'settings' && <section className="space-y-6"><header><p className="t-eyebrow">{c.control}</p><h1 className="t-h1 mt-2">{c.settings}</h1></header><div className="game-settings">
        <Setting title={c.game} body={c.gameBody} checked={state.preferences.enabled} onChange={(enabled) => { update({ ...state, preferences: { ...state.preferences, enabled } }); if (!enabled) recordGameEvent('gamification_disabled', { mode: state.preferences.mode }); }} />
        <Setting title={c.celebrations} body={c.celebrationsBody} checked={state.preferences.celebrations} onChange={(celebrations) => update({ ...state, preferences: { ...state.preferences, celebrations } })} />
        <Setting title={c.landscape} body={c.landscapeBody} checked={state.preferences.landscape} onChange={(landscape) => update({ ...state, preferences: { ...state.preferences, landscape } })} />
        <div className="p-5 border-b border-line"><h2 className="font-bold">Theme</h2><div className="segment mt-4">{(['mint', 'violet', 'sunrise'] as const).map((theme) => <button key={theme} data-active={state.preferences.theme === theme} onClick={() => update({ ...state, preferences: { ...state.preferences, theme } })}>{theme}</button>)}</div></div>
        <div className="p-5"><h2 className="font-bold">{c.planMode}</h2><p className="text-sm text-muted mt-1">{c.planModeBody}</p><div className="segment mt-4">{(['loss', 'maintenance', 'paused'] as PlanMode[]).map((m) => <button key={m} data-active={state.preferences.mode === m} onClick={() => setMode(m)}>{m}</button>)}</div></div>
        <div className="p-5 border-t border-line"><h2 className="font-bold">{c.sync}</h2><p className="text-sm text-muted mt-1">{c.syncBody}</p><div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-primary" onClick={async () => { if (!localStorage.getItem('lw_token')) { setSyncStatus('Sign in to sync with your account.'); return; } setSyncStatus('Syncing'); try { const result = await pushProgress(state); update(result.state); setSyncStatus(result.conflict ? 'A newer version was restored from your account.' : 'Progress synced.'); } catch { setSyncStatus('Could not sync. Your local progress is safe.'); } }}><RefreshCw size={16} />Sync now</button><button className="btn btn-ghost" onClick={() => { const text = exportGame(state); setSyncText(text); navigator.clipboard?.writeText(text); }}><Copy size={16} />{c.copy}</button><button className="btn btn-ghost" onClick={() => { const imported = importGame(syncText); if (imported) update(imported); }}><Upload size={16} />{c.import}</button></div>{syncStatus && <p className="mt-3 text-sm text-muted" role="status">{syncStatus}</p>}<textarea className="field mt-3 min-h-24 text-xs" value={syncText} onChange={(e) => setSyncText(e.target.value)} aria-label={c.sync} /></div>
      </div></section>}
    </div>
  );
}

function Setting({ title, body, checked, onChange }: { title: string; body: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="game-setting"><span><strong>{title}</strong><small>{body}</small></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i aria-hidden="true" /></label>;
}
