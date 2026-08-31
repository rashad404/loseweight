'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Download, Pencil, Trash2, Upload } from 'lucide-react';
import { Field, FieldGroup } from './shared';
import TrendChart from './TrendChart';
import { kgToLb, lbToKg, type Units } from '@/lib/health/units';
import {
  ENTRIES_CHANGED, PLAN_CHANGED, csvToEntries, downloadFile, entriesToCsv,
  loadEntries, loadPlan, removeEntry, saveEntries, upsertEntry,
  type SavedPlan, type WeightEntry,
} from '@/lib/plan/storage';
import { analyzeStall, summarize } from '@/lib/plan/analysis';

const today = () => new Date().toISOString().slice(0, 10);

export default function Tracker() {
  const t = useTranslations('tracker');
  const tc = useTranslations('common');
  const tp = useTranslations('planner');

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [units, setUnits] = useState<Units>('metric');
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ date?: string; weight?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [note, setNote] = useState('');

  // Deferred so the first paint matches the server HTML.
  useEffect(() => {
    const sync = () => {
      setEntries(loadEntries());
      const saved = loadPlan();
      setPlan(saved);
      if (saved) setUnits(saved.units);
    };
    const id = requestAnimationFrame(sync);
    window.addEventListener(ENTRIES_CHANGED, sync);
    window.addEventListener(PLAN_CHANGED, sync);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(ENTRIES_CHANGED, sync);
      window.removeEventListener(PLAN_CHANGED, sync);
    };
  }, []);

  const isMetric = units === 'metric';
  const wUnit = isMetric ? tc('kg') : tc('lb');
  const toW = useCallback((kg: number) => (isMetric ? kg : kgToLb(kg)), [isMetric]);
  const fmt = useCallback((kg: number) => `${toW(kg).toFixed(1)} ${wUnit}`, [toW, wUnit]);

  const progress = useMemo(() => summarize(entries, plan), [entries, plan]);
  const stall = useMemo(() => analyzeStall(entries, plan), [entries, plan]);

  const persist = (next: WeightEntry[]) => {
    setEntries(next);
    if (!saveEntries(next)) setStatus(t('localOnly'));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number.parseFloat(weight);
    const kg = isMetric ? value : lbToKg(value);
    const next: typeof errors = {};

    if (!Number.isFinite(kg) || kg < 20 || kg > 500) next.weight = t('invalidWeight');
    if (!date || date > today()) next.date = t('invalidDate');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const waistValue = Number.parseFloat(waist);
    persist(
      upsertEntry(entries, {
        recordedOn: date,
        weightKg: Math.round(kg * 10) / 10,
        waistCm: Number.isFinite(waistValue) ? waistValue : null,
        note: note.trim() || null,
      }),
    );

    setWeight(''); setWaist(''); setNote(''); setEditing(null); setDate(today());
    setStatus(null);
  };

  const startEdit = (entry: WeightEntry) => {
    setEditing(entry.recordedOn);
    setDate(entry.recordedOn);
    setWeight(toW(entry.weightKg).toFixed(1));
    setWaist(entry.waistCm != null ? String(entry.waistCm) : '');
    setNote(entry.note ?? '');
    setErrors({});
  };

  const importCsv = async (file: File) => {
    const result = csvToEntries(await file.text());
    if (result.imported === 0) { setStatus(t('importEmpty')); return; }
    const merged = result.entries.reduce(upsertEntry, entries);
    persist(merged);
    setStatus(t('importDone', { n: result.imported, skipped: result.skipped }));
  };

  const stallText: Record<typeof stall.verdict, string> = {
    'insufficient-data': t('needThreeWeeks'),
    'sparse-data': t('plateauShort', { weeks: stall.flatWeeks || 1 }),
    'on-track': t('plateauNone'),
    'normal-fluctuation': t('plateauShort', { weeks: stall.flatWeeks }),
    'slower-than-planned': t('plateauShort', { weeks: stall.flatWeeks || 1 }),
    plateau: t('plateauReal', { weeks: stall.flatWeeks }),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr] items-start">
      <section className="panel p-5" aria-labelledby="add-weigh-in">
        <h2 id="add-weigh-in" className="t-h3">{t('addEntry')}</h2>

        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <FieldGroup label={tp('units')}>
            <div className="segment">
              {(['metric', 'imperial'] as Units[]).map((u) => (
                <button key={u} type="button" data-active={units === u} onClick={() => setUnits(u)}>
                  {tp(u)}
                </button>
              ))}
            </div>
          </FieldGroup>

          <Field label={t('date')} error={errors.date}>
            {(p) => (
              <input {...p} type="date" className="field" value={date} max={today()}
                onChange={(e) => setDate(e.target.value)} required />
            )}
          </Field>

          <Field label={`${t('weight')} (${wUnit})`} error={errors.weight}>
            {(p) => (
              <input {...p} type="number" inputMode="decimal" step="0.1" className="field"
                value={weight} placeholder={isMetric ? '78.4' : '172.8'} required
                onChange={(e) => setWeight(e.target.value)} />
            )}
          </Field>

          <Field label={`${t('waist')} (${tc('cm')})`}>
            {(p) => (
              <input {...p} type="number" inputMode="decimal" step="0.1" className="field"
                value={waist} placeholder="88" onChange={(e) => setWaist(e.target.value)} />
            )}
          </Field>

          <Field label={t('note')}>
            {(p) => (
              <input {...p} type="text" className="field" value={note} maxLength={280}
                onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              {editing ? t('update') : t('save')}
            </button>
            {editing && (
              <button type="button" className="btn btn-ghost"
                onClick={() => { setEditing(null); setWeight(''); setWaist(''); setNote(''); setDate(today()); setErrors({}); }}>
                {t('cancel')}
              </button>
            )}
          </div>
        </form>

        <div className="mt-5 pt-5 border-t border-line space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost text-[0.8125rem] py-1.5 px-3"
              disabled={entries.length === 0}
              onClick={() => downloadFile(`loseweight-weigh-ins-${today()}.csv`, entriesToCsv(entries))}>
              <Download size={15} aria-hidden="true" />
              {t('export')}
            </button>

            <button type="button" className="btn btn-ghost text-[0.8125rem] py-1.5 px-3"
              onClick={() => fileRef.current?.click()}>
              <Upload size={15} aria-hidden="true" />
              {t('importLabel')}
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only"
              aria-label={t('importLabel')}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ''; }} />
          </div>

          <p className="text-xs text-muted leading-relaxed">{t('localOnly')}</p>
          <p className="text-xs text-muted leading-relaxed">{t('backupHint')}</p>
        </div>

        <p aria-live="polite" className="sr-only">{status}</p>
        {status && <p className="mt-3 text-[0.8125rem] font-medium text-brand-800">{status}</p>}
      </section>

      <div className="space-y-5">
        {!progress ? (
          <div className="panel p-8">
            <p className="text-muted">{t('noEntries')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t('current')} value={fmt(progress.latest.weightKg)} />
              <Stat label={t('trend')} value={fmt(progress.latest.averageKg)} emphasis />
              <Stat
                label={t('last7')}
                value={progress.change7Kg !== null ? `${progress.change7Kg > 0 ? '+' : ''}${toW(progress.change7Kg).toFixed(1)} ${wUnit}` : '-'}
              />
              <Stat
                label={t('rate')}
                value={progress.slopeKgPerWeek !== null
                  ? `${progress.slopeKgPerWeek > 0 ? '+' : ''}${toW(progress.slopeKgPerWeek).toFixed(2)} ${wUnit}`
                  : '-'}
                sub={t('perWeek')}
              />
            </div>

            {plan ? (
              <section className="panel p-5" aria-labelledby="vs-plan">
                <h2 id="vs-plan" className="t-h3">{t('vsPlan')}</h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-[0.8125rem] text-muted">{t('planned')}</dt>
                    <dd className="t-num text-[1.375rem]">
                      {progress.plannedWeightKg !== null ? fmt(progress.plannedWeightKg) : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.8125rem] text-muted">{t('actual')}</dt>
                    <dd className="t-num text-[1.375rem]">{fmt(progress.latest.averageKg)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.8125rem] text-muted">{t('change')}</dt>
                    <dd className="t-num text-[1.375rem]">
                      {progress.varianceKg === null
                        ? '-'
                        : Math.abs(progress.varianceKg) < 0.25
                          ? t('onPlan')
                          : progress.varianceKg < 0
                            ? t('ahead', { kg: fmt(Math.abs(progress.varianceKg)) })
                            : t('behind', { kg: fmt(progress.varianceKg) })}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : (
              <section className="notice p-4">
                <p className="text-[0.9375rem]">
                  {t('noPlan')}{' '}
                  <Link href="/planner" className="text-brand-800 font-medium hover:underline">
                    {t('noPlanCta')}
                  </Link>
                </p>
              </section>
            )}

            <TrendChart
              points={progress.points}
              plan={plan}
              units={units}
              unitLabel={wUnit}
              labels={{
                raw: t('raw'), trend: t('trend'), planned: t('planned'), goal: t('goalLine'),
                summary: t('chartSummary', {
                  start: progress.first.date,
                  end: progress.latest.date,
                  startWeight: fmt(progress.first.weightKg),
                  latest: fmt(progress.latest.averageKg),
                  change: `${progress.changeKg > 0 ? '+' : ''}${toW(progress.changeKg).toFixed(1)} ${wUnit}`,
                }),
              }}
            />

            <section className="panel p-5" aria-labelledby="stall">
              <h2 id="stall" className="t-h3">{t('plateauCheck')}</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed">{stallText[stall.verdict]}</p>
              <Link href="/calculators/plateau" className="mt-3 inline-block text-[0.875rem] text-brand-800 font-medium hover:underline">
                {t('plateauCheck')}
              </Link>
            </section>

            <section className="panel p-5" aria-labelledby="entries">
              <h2 id="entries" className="t-h3">{t('entries')}</h2>
              <ul className="mt-4 divide-y" style={{ borderColor: 'var(--line)' }}>
                {[...progress.points].reverse().map((point) => {
                  const entry = entries.find((e) => e.recordedOn === point.date)!;
                  return (
                    <li key={point.date} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[0.9375rem] font-semibold t-num">{fmt(entry.weightKg)}</span>
                        <span className="ml-3 text-[0.875rem] text-muted">{entry.recordedOn}</span>
                        {entry.waistCm != null && (
                          <span className="ml-3 text-[0.875rem] text-muted">
                            {t('waist')}: {entry.waistCm} {tc('cm')}
                          </span>
                        )}
                        {entry.note && <p className="text-xs text-muted truncate">{entry.note}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => startEdit(entry)}
                          aria-label={`${t('edit')} ${entry.recordedOn}`}
                          className="p-1.5 rounded-lg hover:sunken text-muted">
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => persist(removeEntry(entries, entry.recordedOn))}
                          aria-label={`${t('delete')} ${entry.recordedOn}`}
                          className="p-1.5 rounded-lg hover:sunken text-muted">
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, emphasis }: { label: string; value: string; sub?: string; emphasis?: boolean }) {
  return (
    <div className="panel p-4" style={emphasis ? { borderColor: 'var(--color-brand-500)', borderWidth: 2 } : undefined}>
      <div className="text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-muted">{label}</div>
      <div className={`mt-1.5 t-num text-[1.375rem] ${emphasis ? 'text-brand-800' : ''}`}>{value}</div>
      {sub && <div className="text-[0.75rem] text-muted">{sub}</div>}
    </div>
  );
}
