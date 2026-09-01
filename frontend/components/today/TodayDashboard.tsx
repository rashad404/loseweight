'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Check, ChevronDown, CircleDashed, HeartHandshake, Palette, RefreshCw, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import ProgressRing from './ProgressRing';
import ProgressLandscape from './ProgressLandscape';
import { calculateConsistency, isoDay, specificFeedback } from '@/lib/gamification/engine';
import { initialState, loadGame, saveGame, transitionAction } from '@/lib/gamification/storage';
import type { ActionState, DailyAction, GamificationState, PlanMode } from '@/lib/gamification/models';

const achievementCopy = {
  'first-check': ['First step', 'Completed your first planned action'],
  'flexible-plan': ['Plan shaper', 'Made the plan easier instead of abandoning it'],
  'welcome-back': ['Welcome back', 'Returned after time away'],
  'steady-week': ['Steady week', 'Showed up on five of the last seven days'],
  'quest-complete': ['Quest complete', 'Repeated one workable change'],
} as const;

export default function TodayDashboard() {
  const date = isoDay();
  const [state, setState] = useState<GamificationState>(() => initialState(date));
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'today' | 'progress' | 'circle' | 'settings'>('today');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { const id = requestAnimationFrame(() => { setState(loadGame(date)); setReady(true); }); return () => cancelAnimationFrame(id); }, [date]);
  const update = (next: GamificationState) => { setState(next); saveGame(next); };
  const today = state.actions.filter((a) => a.date === date).slice(0, 3);
  const doneToday = today.filter((a) => a.state === 'completed' || a.state === 'adjusted').length;
  const consistency = useMemo(() => calculateConsistency(state.actions), [state.actions]);
  const changeAction = (a: DailyAction, next: ActionState, replacement?: string) => {
    update(transitionAction(state, a.id, next, replacement)); setOpen(null);
  };
  const setMode = (mode: PlanMode) => update({ ...state, preferences: { ...state.preferences, mode } });

  if (!ready) return <div className="panel min-h-96 animate-pulse sunken" aria-label="Loading today" />;

  return (
    <div className="game-shell">
      <nav className="game-tabs" aria-label="Today sections">
        {([['today', CircleDashed, 'Today'], ['progress', Trophy, 'Progress'], ['circle', HeartHandshake, 'Circle'], ['settings', Palette, 'Settings']] as const).map(([id, Icon, label]) => (
          <button key={id} data-active={tab === id} onClick={() => setTab(id)}><Icon size={17} />{label}</button>
        ))}
      </nav>

      {tab === 'today' && <>
        <section className="game-hero">
          <div className="relative z-10 max-w-xl">
            <p className="t-eyebrow !text-white/70">Your day, your pace</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] text-white">{doneToday} of {today.length} complete</h1>
            <p className="mt-3 text-white/75">{specificFeedback(state.actions, date)}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm text-white">
              <ShieldCheck size={16} /> {state.preferences.mode === 'maintenance' ? 'Maintenance week' : state.preferences.mode === 'paused' ? 'Plan paused' : 'Active weekly plan'}
            </div>
          </div>
          <ProgressLandscape ratio={today.length ? doneToday / today.length : 0} enabled={state.preferences.landscape && state.preferences.enabled} />
        </section>

        {state.preferences.mode === 'paused' ? (
          <section className="game-soft-card text-center py-12"><RefreshCw className="mx-auto text-violet-500" /><h2 className="t-h2 mt-4">Your plan is paused</h2><p className="text-muted mt-2">Nothing is being counted. Everything you earned is still here.</p><button className="btn btn-primary mt-5" onClick={() => setMode('maintenance')}>Resume in maintenance</button></section>
        ) : <section className="space-y-3" aria-labelledby="actions-heading">
          <div className="flex items-end justify-between gap-4"><div><p className="t-eyebrow">Today</p><h2 id="actions-heading" className="t-h2 mt-1">Three things that matter</h2></div><span className="text-sm text-muted">Change any action</span></div>
          {today.map((action, index) => <article key={action.id} className="game-action" data-state={action.state}>
            <button className="game-check" aria-label={`Mark ${action.title} complete`} onClick={() => changeAction(action, action.state === 'completed' ? 'available' : 'completed')}>
              {action.state === 'completed' || action.state === 'adjusted' ? <Check size={20} /> : <span>{index + 1}</span>}
            </button>
            <div className="min-w-0 flex-1"><h3 className="font-bold leading-snug">{action.title}</h3><p className="mt-1 text-sm text-muted">{action.rationale}</p><p className="mt-2 text-xs font-semibold text-violet-500">{action.sourceLabel}</p></div>
            <button className="game-more" aria-expanded={open === action.id} onClick={() => setOpen(open === action.id ? null : action.id)} aria-label={`Options for ${action.title}`}><ChevronDown size={19} /></button>
            {open === action.id && <div className="game-action-menu">
              <button onClick={() => changeAction(action, 'adjusted')}>Make easier</button>
              {action.alternatives.map((alt) => <button key={alt} onClick={() => changeAction(action, 'adjusted', alt)}>Replace: {alt}</button>)}
              <button onClick={() => changeAction(action, 'rescheduled')}>Move to another day</button>
              <button onClick={() => changeAction(action, 'skipped_reasonable')}>Does not fit today</button>
              <button onClick={() => changeAction(action, 'skipped')}>Skip</button>
            </div>}
          </article>)}
        </section>}

        <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="game-soft-card flex items-center gap-5"><ProgressRing completed={consistency.completed} planned={consistency.planned} /><div><p className="t-eyebrow">Weekly momentum</p><h2 className="t-h3 mt-2">{consistency.completed} of {consistency.planned} planned actions</h2><p className="text-sm text-muted mt-2">Across {consistency.activeDays} active days. Weight never changes this count.</p></div></div>
          <div className="game-quest"><Sparkles size={20} /><div><p className="text-xs uppercase tracking-wider font-bold opacity-70">Weekly quest</p><h2 className="font-bold mt-1">{state.quest.title}</h2><p className="text-sm opacity-75 mt-1">{state.quest.progress} of {state.quest.target} days</p><div className="game-quest-bar"><span style={{ width: `${state.quest.progress / state.quest.target * 100}%` }} /></div></div></div>
        </section>
      </>}

      {tab === 'progress' && <section className="space-y-6"><header><p className="t-eyebrow">Your progress</p><h1 className="t-h1 mt-2">What you have built</h1><p className="t-lead mt-3">Actions and flexibility, never body size or speed of loss.</p></header><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Object.entries(achievementCopy).map(([id, copy]) => { const earned = state.achievements.find((a) => a.id === id); return <article key={id} className={`game-achievement ${earned ? '' : 'opacity-45'}`}><Award size={24} /><h2 className="font-bold mt-4">{copy[0]}</h2><p className="text-sm text-muted mt-1">{copy[1]}</p><p className="text-xs mt-4 font-semibold">{earned ? `Earned ${earned.earnedAt.slice(0, 10)}` : 'Still available'}</p></article>; })}</div></section>}

      {tab === 'circle' && <section className="space-y-6"><header><p className="t-eyebrow">Cooperative, never comparative</p><h1 className="t-h1 mt-2">Your circle</h1><p className="t-lead mt-3">Build a private group around encouragement and shared actions. Weight, calories, and rankings are never shared.</p></header><div className="game-circle"><HeartHandshake size={30} /><h2 className="t-h2 mt-4">Create a private circle</h2><p className="text-muted mt-2 max-w-xl">Invite people you trust, choose a collective consistency goal, and send simple encouragement. This device-local preview is ready for account synchronization.</p><button className="btn btn-primary mt-5">Create circle</button></div></section>}

      {tab === 'settings' && <section className="space-y-6"><header><p className="t-eyebrow">You are in control</p><h1 className="t-h1 mt-2">Experience settings</h1></header><div className="game-settings">
        <Setting title="Supportive game layer" body="Turn off rings, quests, achievements, and celebrations. Your plan and tracker continue to work." checked={state.preferences.enabled} onChange={(enabled) => update({ ...state, preferences: { ...state.preferences, enabled } })} />
        <Setting title="Celebrations" body="Show brief motion for meaningful milestones." checked={state.preferences.celebrations} onChange={(celebrations) => update({ ...state, preferences: { ...state.preferences, celebrations } })} />
        <Setting title="Evolving landscape" body="Let the Today landscape reflect completed planned actions." checked={state.preferences.landscape} onChange={(landscape) => update({ ...state, preferences: { ...state.preferences, landscape } })} />
        <div className="p-5"><h2 className="font-bold">Plan mode</h2><p className="text-sm text-muted mt-1">Maintenance and recovery count exactly like an active loss plan.</p><div className="segment mt-4">{(['loss', 'maintenance', 'paused'] as PlanMode[]).map((m) => <button key={m} data-active={state.preferences.mode === m} onClick={() => setMode(m)}>{m}</button>)}</div></div>
      </div></section>}
    </div>
  );
}

function Setting({ title, body, checked, onChange }: { title: string; body: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="game-setting"><span><strong>{title}</strong><small>{body}</small></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i aria-hidden="true" /></label>;
}
