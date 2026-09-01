'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Award, Check, ChevronDown, CircleDashed, Copy, Heart, HeartHandshake, Palette, RefreshCw, ShieldCheck, Sparkles, Trophy, Upload } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { loadDay, loadDays, loadWeekly, saveDay, saveWeekly, setActionState, type ActionState, type DayRecord } from '@/lib/plan/storage';
import type { PlanChange, WeeklyPlan } from '@/lib/routine/models';
import { localizedChangeParams } from '@/lib/routine/presentation';
import { calculateConsistency, calculateProgression, isoDay } from '@/lib/gamification/engine';
import { createLocalId, exportGame, importGame, initialState, loadGame, saveGame } from '@/lib/gamification/storage';
import { recordGameEvent } from '@/lib/gamification/analytics';
import { createRemoteCircle, flushGameEvents, joinRemoteCircle, pushProgress, sendRemoteReaction, updateRemoteContribution } from '@/lib/gamification/api';
import type { GamificationState, PlanMode, SupportCircle } from '@/lib/gamification/models';
import { gameCopy, type GameLocale } from './copy';
import ProgressLandscape from './ProgressLandscape';
import ProgressRing from './ProgressRing';

const achievementIds = ['first-check', 'flexible-plan', 'welcome-back', 'steady-week', 'quest-complete'] as const;

export default function TodayDashboard({ locale }: { locale: string }) {
  const c = gameCopy[(locale in gameCopy ? locale : 'en') as GameLocale];
  const t = useTranslations('today');
  const tc = useTranslations();
  const tp = useTranslations('change.param');
  const date = isoDay();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [day, setDay] = useState<DayRecord>({ date, followed: [], skipped: [], usedFlexibleMeal: false, actions: {} });
  const [days, setDays] = useState<DayRecord[]>([]);
  const [state, setState] = useState<GamificationState>(() => initialState(null, date));
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'today' | 'progress' | 'circle' | 'settings'>('today');
  const [open, setOpen] = useState<string | null>(null);
  const [syncText, setSyncText] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const weekly = loadWeekly();
      const current = loadDay(date);
      const history = loadDays();
      setPlan(weekly);
      setDay(current);
      setDays(history);
      setState(loadGame(weekly, date));
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [date]);

  const accepted = useMemo(() => plan?.changes.filter((change) => change.accepted).slice(0, 3) ?? [], [plan]);
  const consistency = useMemo(() => calculateConsistency(days, plan), [days, plan]);
  const progression = useMemo(() => calculateProgression(state, days), [state, days]);
  const actionState = (change: PlanChange): ActionState => day.actions?.[change.id]?.state
    ?? (day.followed.includes(change.id) ? 'completed' : day.skipped.includes(change.id) ? 'skipped' : 'available');
  const doneToday = accepted.filter((change) => ['completed', 'adjusted'].includes(actionState(change))).length;
  const adjustedToday = accepted.some((change) => actionState(change) === 'adjusted');
  const feedback = adjustedToday ? c.feedback[2] : doneToday === accepted.length && doneToday > 0 ? c.feedback[3] : doneToday > 0 ? `${doneToday} ${c.feedback[1]}` : c.feedback[0];

  const persistGame = (nextState: GamificationState, nextDays = days) => {
    const saved = saveGame(nextState, nextDays, plan);
    setState(saved ?? nextState);
  };

  const changeAction = (change: PlanChange, next: ActionState, replacement?: string, rescheduledTo?: string) => {
    const nextDay = setActionState(day, change.id, next, { replacement, rescheduledTo });
    saveDay(nextDay);
    const nextDays = [...days.filter((entry) => entry.date !== date), nextDay].sort((a, b) => a.date.localeCompare(b.date));
    setDay(nextDay);
    setDays(nextDays);
    persistGame(state, nextDays);
    const event = next === 'completed' ? 'action_completed' : next === 'adjusted' ? 'action_adjusted' : next === 'rescheduled' ? 'action_rescheduled' : next === 'skipped_reasonable' ? 'action_skipped_reasonable' : next === 'skipped' ? 'action_skipped' : null;
    if (event) recordGameEvent(event, { sourceType: 'accepted_change', actionState: next, mode: state.preferences.mode });
    setOpen(null);
  };

  const setMode = (mode: PlanMode) => {
    if (plan && mode !== 'paused') {
      const nextPlan = { ...plan, mode };
      saveWeekly(nextPlan);
      setPlan(nextPlan);
    }
    persistGame({ ...state, preferences: { ...state.preferences, mode } });
  };
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoDay(d); })();
  const questChange = plan?.changes.find((change) => change.id === state.quest.sourceChangeId) ?? null;

  if (!ready) return <div className="panel min-h-96 animate-pulse sunken" aria-label={c.today} />;

  return (
    <div className="game-shell" data-game-theme={state.preferences.theme}>
      <nav className="game-tabs" aria-label={c.today}>
        {([['today', CircleDashed], ['progress', Trophy], ['circle', HeartHandshake], ['settings', Palette]] as const).map(([id, Icon], index) => (
          <button key={id} data-active={tab === id} onClick={() => setTab(id)}><Icon size={17} />{c.tabs[index]}</button>
        ))}
      </nav>

      {tab === 'today' && <>
        <section className="game-hero">
          <div className="relative z-10 max-w-xl">
            <p className="t-eyebrow !text-white/70">{c.pace}</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] text-white">{accepted.length > 0 ? `${doneToday} / ${accepted.length} ${c.complete}` : c.emptyHeroTitle}</h1>
            <p className="mt-3 text-white/75">{accepted.length > 0 ? feedback : c.emptyHeroBody}</p>
            {accepted.length > 0 && <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm text-white"><ShieldCheck size={16} />{state.preferences.mode === 'maintenance' ? c.modes[1] : state.preferences.mode === 'paused' ? c.modes[2] : c.modes[0]}</div>}
          </div>
          <ProgressLandscape ratio={accepted.length ? doneToday / accepted.length : 0} enabled={state.preferences.landscape && state.preferences.enabled} />
        </section>

        {state.preferences.mode === 'paused' ? (
          <section className="game-soft-card text-center py-12"><RefreshCw className="mx-auto text-violet-500" /><h2 className="t-h2 mt-4">{c.pausedTitle}</h2><p className="text-muted mt-2">{c.pausedBody}</p><button className="btn btn-primary mt-5" onClick={() => setMode('maintenance')}>{c.resume}</button></section>
        ) : !plan || accepted.length === 0 ? (
          <section className="game-soft-card py-10 text-center"><h2 className="t-h2">{c.emptyTitle}</h2><p className="text-muted mt-2">{c.emptyBody}</p><Link href="/onboarding" className="btn btn-primary mt-5">{c.onboarding}</Link></section>
        ) : (
          <section className="space-y-3" aria-labelledby="actions-heading">
            <div className="flex items-end justify-between gap-4"><div><p className="t-eyebrow">{c.today}</p><h2 id="actions-heading" className="t-h2 mt-1">{c.matters}</h2></div><span className="text-sm text-muted">{c.change}</span></div>
            {accepted.map((change, index) => {
              const current = actionState(change);
              const displayed = day.actions?.[change.id]?.replacement;
              const params = localizedChangeParams(change.params, tp);
              return <article key={change.id} className="game-action" data-state={current}>
                <button className="game-check" aria-label={tc(change.title, params)} onClick={() => changeAction(change, current === 'completed' ? 'available' : 'completed')}>
                  {current === 'completed' || current === 'adjusted' ? <Check size={20} /> : <span>{index + 1}</span>}
                </button>
                <div className="min-w-0 flex-1"><h3 className="font-bold">{displayed ? tc(displayed) : tc(change.title, params)}</h3><p className="text-sm text-muted mt-1">{tc(change.rationale, params)}</p><p className="text-xs text-muted mt-2">{c.sourceAccepted}</p></div>
                <button className="game-menu-trigger" aria-expanded={open === change.id} onClick={() => setOpen(open === change.id ? null : change.id)}><ChevronDown size={18} /></button>
                {open === change.id && <div className="game-action-menu">
                  <button onClick={() => changeAction(change, 'adjusted', change.alternatives[0])}>{c.makeEasier}</button>
                  {change.alternatives.map((alternative) => <button key={alternative} onClick={() => changeAction(change, 'adjusted', alternative)}>{c.replace}: {tc(alternative)}</button>)}
                  <button onClick={() => changeAction(change, 'rescheduled', undefined, tomorrow)}>{c.move}</button>
                  <button onClick={() => changeAction(change, 'skipped_reasonable')}>{c.unsuitable}</button>
                  <button onClick={() => changeAction(change, 'skipped')}>{c.skip}</button>
                </div>}
              </article>;
            })}
          </section>
        )}

        {state.preferences.enabled && state.preferences.celebrations && doneToday === accepted.length && doneToday > 0 && <div className="game-celebration" role="status"><Sparkles size={20} />{feedback}</div>}

        {accepted.length > 0 && (state.preferences.enabled ? <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="game-soft-card flex items-center gap-5"><ProgressRing completed={consistency.completed} planned={consistency.planned} /><div><p className="t-eyebrow">{c.momentum}</p><h2 className="t-h3 mt-2">{consistency.completed} / {consistency.planned} {c.planned}</h2><p className="text-sm text-muted mt-2">{consistency.activeDays} {c.activeDays}</p></div></div>
          <div className="game-quest"><Sparkles size={20} /><div><p className="text-xs uppercase tracking-wider font-bold opacity-70">{c.quest}</p><h2 className="font-bold mt-1">{questChange ? tc(questChange.title, localizedChangeParams(questChange.params, tp)) : c.questTitle}</h2><p className="text-sm opacity-75 mt-1">{state.quest.progress} / {state.quest.target} {c.days}</p><div className="game-quest-bar"><span style={{ width: `${state.quest.progress / state.quest.target * 100}%` }} /></div></div></div>
        </section> : <section className="game-soft-card"><p className="font-semibold">{consistency.completed} / {consistency.planned} {c.planned}</p><p className="text-sm text-muted mt-1">{c.progressOff}</p></section>)}

        {plan && <section className="grid gap-4 lg:grid-cols-2">
          {plan.templates.length > 0 && <div className="game-soft-card lg:col-span-2"><h2 className="t-h3">{t('eatTitle')}</h2><p className="text-sm text-muted mt-1">{t('eatIntro')}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">{plan.templates.map((template) => <div className="sunken rounded-xl p-4" key={template.slot}><p className="field-label">{t(`slot.${template.slot}`)}</p><div className="flex flex-wrap gap-1.5 mt-2">{template.options.map((option) => <span className="text-xs px-2.5 py-1.5 rounded-lg border border-line" key={option}>{option}</span>)}</div></div>)}</div></div>}
          <div className="game-soft-card"><h2 className="t-h4">{t('outTitle')}</h2><ul className="mt-2 space-y-2 text-sm text-muted">{plan.eatingOutRules.map((key) => <li key={key}>{tc(key)}</li>)}</ul></div>
          <div className="game-soft-card"><h2 className="t-h4">{t('hungerTitle')}</h2><ul className="mt-2 space-y-2 text-sm text-muted">{plan.hungerRescue.map((key) => <li key={key}>{tc(key)}</li>)}</ul></div>
          <div className="game-soft-card lg:col-span-2"><h2 className="t-h4">{t('flexTitle')}</h2><p className="mt-2 text-sm text-muted">{tc(plan.flexibleMeal)}</p>{day.usedFlexibleMeal ? <p className="mt-3 text-sm text-brand-800 font-medium">{t('flexUsed')}</p> : <button className="btn btn-ghost btn-sm mt-3" onClick={() => { const next = { ...day, usedFlexibleMeal: true }; saveDay(next); setDay(next); }}>{t('flexUse')}</button>}</div>
        </section>}
      </>}

      {tab === 'progress' && <section className="space-y-6"><header><p className="t-eyebrow">{c.progressEye}</p><h1 className="t-h1 mt-2">{c.progressTitle}</h1><p className="t-lead mt-3">{c.progressBody}</p></header>{!state.preferences.enabled ? <div className="game-soft-card"><p>{c.progressOff}</p></div> : <><div className="game-level"><div><p className="t-eyebrow">{c.level}</p><p className="t-num text-4xl mt-2">{progression.level}</p><p className="text-sm text-muted mt-1">{progression.current} {c.credits}</p></div><div className="flex-1"><div className="game-quest-bar !bg-black/10"><span style={{ width: `${Math.min(100, progression.current / progression.next * 100)}%` }} /></div><p className="text-xs text-muted mt-2">{c.cosmetic}</p></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{achievementIds.map((id, index) => { const earned = state.achievements.find((achievement) => achievement.id === id); const copy = c.achievements[index]; return <article key={id} className={`game-achievement ${earned ? '' : 'opacity-45'}`}><Award size={24} /><h2 className="font-bold mt-4">{copy[0]}</h2><p className="text-sm text-muted mt-1">{copy[1]}</p><p className="text-xs mt-4 font-semibold">{earned ? `${c.earned} ${earned.earnedAt.slice(0, 10)}` : c.available}</p></article>; })}</div></>}</section>}

      {tab === 'circle' && <CirclePanel c={c} state={state} consistency={consistency.completed} update={persistGame} />}

      {tab === 'settings' && <section className="space-y-6"><header><p className="t-eyebrow">{c.control}</p><h1 className="t-h1 mt-2">{c.settings}</h1></header><div className="game-settings">
        <Setting title={c.game} body={c.gameBody} checked={state.preferences.enabled} onChange={(enabled) => { persistGame({ ...state, preferences: { ...state.preferences, enabled } }); if (!enabled) recordGameEvent('gamification_disabled', { mode: state.preferences.mode }); }} />
        <Setting title={c.celebrations} body={c.celebrationsBody} checked={state.preferences.celebrations} onChange={(celebrations) => persistGame({ ...state, preferences: { ...state.preferences, celebrations } })} />
        <Setting title={c.landscape} body={c.landscapeBody} checked={state.preferences.landscape} onChange={(landscape) => persistGame({ ...state, preferences: { ...state.preferences, landscape } })} />
        <div className="p-5 border-b border-line"><h2 className="font-bold">{c.theme}</h2><p className="text-sm text-muted mt-1">{c.themeBody}</p><div className="segment mt-4">{(['mint', 'violet', 'sunrise'] as const).map((theme, index) => <button key={theme} disabled={!progression.unlockedThemes.includes(theme)} data-active={state.preferences.theme === theme} onClick={() => persistGame({ ...state, preferences: { ...state.preferences, theme } })}>{c.themes[index]}</button>)}</div></div>
        <div className="p-5"><h2 className="font-bold">{c.planMode}</h2><p className="text-sm text-muted mt-1">{c.planModeBody}</p><div className="segment mt-4">{(['loss', 'maintenance', 'paused'] as PlanMode[]).map((mode, index) => <button key={mode} data-active={state.preferences.mode === mode} onClick={() => setMode(mode)}>{c.modes[index]}</button>)}</div></div>
        <div className="p-5 border-t border-line"><h2 className="font-bold">{c.sync}</h2><p className="text-sm text-muted mt-1">{c.syncBody}</p><div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-primary" onClick={async () => { if (!localStorage.getItem('lw_token')) { setSyncStatus(c.syncMessages[0]); return; } setSyncStatus(c.syncMessages[1]); try { const result = await pushProgress(state, days); result.days.forEach(saveDay); setDays(result.days); setDay(result.days.find((entry) => entry.date === date) ?? loadDay(date)); persistGame(result.state, result.days); await flushGameEvents(); setSyncStatus(result.conflict ? c.syncMessages[2] : c.syncMessages[3]); } catch { setSyncStatus(c.syncMessages[4]); } }}><RefreshCw size={16} />{c.syncNow}</button><button className="btn btn-ghost" onClick={() => { const text = exportGame(state, days); setSyncText(text); navigator.clipboard?.writeText(text); }}><Copy size={16} />{c.copy}</button><button className="btn btn-ghost" onClick={() => { const imported = importGame(syncText); if (imported) { imported.days.forEach(saveDay); setDays(imported.days); setDay(imported.days.find((entry) => entry.date === date) ?? loadDay(date)); persistGame(imported.state, imported.days); } }}><Upload size={16} />{c.import}</button></div>{syncStatus && <p className="mt-3 text-sm text-muted" role="status">{syncStatus}</p>}<textarea className="field mt-3 min-h-24 text-xs" value={syncText} onChange={(event) => setSyncText(event.target.value)} aria-label={c.sync} /></div>
      </div></section>}
    </div>
  );
}

function CirclePanel({ c, state, consistency, update }: { c: (typeof gameCopy)[GameLocale]; state: GamificationState; consistency: number; update: (state: GamificationState) => void }) {
  const [joinCode, setJoinCode] = useState('');
  return <section className="space-y-6"><header><p className="t-eyebrow">{c.circleEye}</p><h1 className="t-h1 mt-2">{c.circleTitle}</h1><p className="t-lead mt-3">{c.circleBody}</p></header>{!state.circle ? <div className="game-circle"><HeartHandshake size={30} /><h2 className="t-h2 mt-4">{c.createTitle}</h2><p className="text-muted mt-2 max-w-xl">{c.createBody}</p><div className="mt-5 flex flex-wrap gap-2"><button className="btn btn-primary" onClick={async () => { let circle: SupportCircle = { id: createLocalId(), name: c.circleTitle, collectiveTarget: 20, inviteCode: createLocalId().replaceAll('-', '').slice(0, 8).toUpperCase(), members: [{ id: 'me', name: c.today, contribution: consistency, reaction: null }] }; if (localStorage.getItem('lw_token')) { try { circle = await createRemoteCircle(c.circleTitle, c.today); } catch { /* Local circle remains usable. */ } } update({ ...state, circle }); recordGameEvent('circle_created', { circleSize: 1 }); }}>{c.create}</button><input className="field max-w-48" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder={c.joinCode} /><button className="btn btn-ghost" disabled={!joinCode.trim() || !localStorage.getItem('lw_token')} onClick={async () => { try { const circle = await joinRemoteCircle(joinCode.trim(), c.today); update({ ...state, circle }); } catch { /* The invite remains available for correction. */ } }}>{c.join}</button></div></div> : <div className="game-circle"><div className="flex flex-wrap justify-between gap-4"><div><p className="t-eyebrow">{c.private}</p><h2 className="t-h2 mt-2">{state.circle.name}</h2></div><button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(state.circle!.inviteCode)}><Copy size={16} />{state.circle.inviteCode}</button></div><p className="mt-6 text-sm text-muted">{c.collective}</p><p className="t-num text-3xl mt-1">{state.circle.members.reduce((sum, member) => sum + member.contribution, 0)} / {state.circle.collectiveTarget}</p>{/^\d+$/.test(state.circle.id) && <button className="btn btn-ghost btn-sm mt-3" onClick={async () => { try { const circle = await updateRemoteContribution(state.circle!.id, consistency); update({ ...state, circle }); } catch { /* Local progress remains safe. */ } }}>{c.contribution}</button>}<div className="mt-6 grid gap-3">{state.circle.members.map((member) => <div className="flex items-center justify-between rounded-xl sunken p-4" key={member.id}><div><strong>{member.name}</strong><p className="text-sm text-muted">{member.contribution} {c.shared}</p></div><button className="btn btn-ghost" onClick={async () => { let circle = { ...state.circle!, members: state.circle!.members.map((item) => item.id === member.id ? { ...item, reaction: 'heart' as const } : item) }; if (localStorage.getItem('lw_token') && /^\d+$/.test(circle.id)) { try { circle = await sendRemoteReaction(circle.id, member.id); } catch { /* Preserve optimistic reaction. */ } } update({ ...state, circle }); recordGameEvent('encouragement_sent', { circleSize: circle.members.length }); }}><Heart size={16} fill={member.reaction === 'heart' ? 'currentColor' : 'none'} />{c.encourage}</button></div>)}</div></div>}</section>;
}

function Setting({ title, body, checked, onChange }: { title: string; body: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="game-setting"><span><strong>{title}</strong><small>{body}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}
