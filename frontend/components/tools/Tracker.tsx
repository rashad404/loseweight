'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Field } from './shared';
import ProjectionChart, { type Series } from './ProjectionChart';
import { kgToLb, lbToKg, type Units } from '@/lib/health/units';

interface Entry {
  recorded_on: string;
  weight_kg: number;
  waist_cm?: number | null;
  note?: string | null;
}

const STORAGE_KEY = 'lw_entries';

/** Centered 7 day mean, which is what makes a real trend visible. */
function rollingAverage(entries: Entry[]): { date: string; value: number }[] {
  return entries.map((entry, i) => {
    const anchor = new Date(entry.recorded_on).getTime();
    const window = entries.filter((e) => {
      const diff = Math.abs(new Date(e.recorded_on).getTime() - anchor);
      return diff <= 3 * 86400000;
    });
    const mean = window.reduce((sum, e) => sum + e.weight_kg, 0) / window.length;
    return { date: entry.recorded_on, value: mean };
  });
}

export default function Tracker() {
  const t = useTranslations('tracker');
  const tc = useTranslations('common');
  const tp = useTranslations('planner');

  const [entries, setEntries] = useState<Entry[]>([]);
  const [units, setUnits] = useState<Units>('metric');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [note, setNote] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Deferred so the first paint matches the server HTML. Reading storage
    // synchronously here would set state during the initial commit.
    const id = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setEntries(JSON.parse(raw));
      } catch {
        // A corrupt or unreadable store should not break the page.
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  const isMetric = units === 'metric';
  const wUnit = isMetric ? tc('kg') : tc('lb');
  const toW = (kg: number) => (isMetric ? kg : kgToLb(kg));

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.recorded_on.localeCompare(b.recorded_on)),
    [entries],
  );

  const stats = useMemo(() => {
    if (sorted.length === 0) return null;

    const averages = rollingAverage(sorted);
    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    const latestAvg = averages[averages.length - 1].value;

    const spanDays =
      (new Date(latest.recorded_on).getTime() - new Date(first.recorded_on).getTime()) / 86400000;

    // Count trailing weeks where the rolling average has not meaningfully fallen.
    let flatWeeks = 0;
    if (averages.length >= 7) {
      for (let w = 1; w <= 8; w++) {
        const then = new Date(latest.recorded_on).getTime() - w * 7 * 86400000;
        const near = averages.reduce((best, a) =>
          Math.abs(new Date(a.date).getTime() - then) <
          Math.abs(new Date(best.date).getTime() - then)
            ? a
            : best,
        );
        if (Math.abs(new Date(near.date).getTime() - then) > 4 * 86400000) break;
        if (near.value - latestAvg > 0.2) break;
        flatWeeks = w;
      }
    }

    return {
      averages,
      latest,
      first,
      latestAvg,
      change: latest.weight_kg - first.weight_kg,
      spanDays,
      flatWeeks,
      enoughData: spanDays >= 21,
    };
  }, [sorted]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(weight);
    if (Number.isNaN(value)) return;

    const kg = isMetric ? value : lbToKg(value);
    const waistValue = waist ? parseFloat(waist) : null;

    setEntries((prev) => [
      ...prev.filter((entry) => entry.recorded_on !== date),
      {
        recorded_on: date,
        weight_kg: Math.round(kg * 10) / 10,
        waist_cm: waistValue,
        note: note || null,
      },
    ]);

    setWeight('');
    setWaist('');
    setNote('');
  };

  const chartSeries: Series[] = useMemo(() => {
    if (!stats || sorted.length < 2) return [];
    const day0 = new Date(sorted[0].recorded_on).getTime();
    const week = (iso: string) => (new Date(iso).getTime() - day0) / (7 * 86400000);

    return [
      {
        label: t('trend'),
        color: 'var(--color-brand-500)',
        points: stats.averages.map((a) => ({ week: week(a.date), weight: toW(a.value) })),
      },
      {
        label: t('current'),
        color: 'var(--text-muted)',
        dashed: true,
        points: sorted.map((e) => ({ week: week(e.recorded_on), weight: toW(e.weight_kg) })),
      },
    ];
  }, [stats, sorted, units, t]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
      <div className="panel p-5">
        <h2 className="t-h3">{t('addEntry')}</h2>

        <form onSubmit={add} className="mt-4 space-y-4">
          <Field label={tp('units')}>
            <div className="segment">
            {(['metric', 'imperial'] as Units[]).map((u) => (
              <button key={u} type="button" data-active={units === u} onClick={() => setUnits(u)}>
                {tp(u)}
              </button>
            ))}
          </div>
          </Field>

          <Field label={t('date')}>
            <input type="date" className="field" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)} />
          </Field>

          <Field label={`${t('weight')} (${wUnit})`}>
            <input type="number" step="0.1" className="field" value={weight} required
              placeholder={isMetric ? '78.4' : '172.8'}
              onChange={(e) => setWeight(e.target.value)} />
          </Field>

          <Field label={`${t('waist')} (${tc('cm')})`}>
            <input type="number" step="0.1" className="field" value={waist} placeholder="88"
              onChange={(e) => setWaist(e.target.value)} />
          </Field>

          <Field label={t('note')}>
            <input type="text" className="field" value={note} maxLength={280}
              onChange={(e) => setNote(e.target.value)} />
          </Field>

          <button type="submit" className="btn btn-primary w-full">{t('save')}</button>
        </form>

        <p className="mt-4 text-xs text-muted leading-relaxed">{t('localOnly')}</p>
      </div>

      <div className="space-y-5">
        {!stats ? (
          <div className="panel p-8">
            <p className="text-muted">{t('noEntries')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="panel p-4">
                <div className="text-xs font-semibold text-muted uppercase tracking-wide">{t('current')}</div>
                <div className="mt-1.5 text-2xl font-bold">
                  {toW(stats.latest.weight_kg).toFixed(1)}
                  <span className="ml-1 text-sm font-semibold text-muted">{wUnit}</span>
                </div>
              </div>
              <div className="panel p-4 border-brand-500">
                <div className="text-xs font-semibold text-muted uppercase tracking-wide">{t('trend')}</div>
                <div className="mt-1.5 text-2xl font-bold text-brand-800">
                  {toW(stats.latestAvg).toFixed(1)}
                  <span className="ml-1 text-sm font-semibold text-muted">{wUnit}</span>
                </div>
              </div>
              <div className="panel p-4">
                <div className="text-xs font-semibold text-muted uppercase tracking-wide">{t('change')}</div>
                <div className={`mt-1.5 text-2xl font-bold ${stats.change < 0 ? 'text-brand-800' : ''}`}>
                  {stats.change > 0 ? '+' : ''}{toW(stats.change).toFixed(1)}
                  <span className="ml-1 text-sm font-semibold text-muted">{wUnit}</span>
                </div>
                <div className="text-xs text-muted">{t('sinceStart')}</div>
              </div>
            </div>

            {chartSeries.length > 0 && (
              <div className="panel p-5">
                <h2 className="t-h3">{t('trend')}</h2>
                <div className="mt-4">
                  <ProjectionChart
                    series={chartSeries}
                    goalWeight={toW(stats.latestAvg)}
                    goalLabel={t('trend')}
                    unitSuffix={wUnit}
                    weekLabel={(w) => `${tc('weeks')} ${w.toFixed(1)}`}
                    formatWeight={(v) => v.toFixed(1)}
                  />
                </div>
              </div>
            )}

            <div className="panel p-5">
              <h2 className="t-h3">{t('plateauCheck')}</h2>
              <p className="mt-2 text-sm leading-relaxed">
                {!stats.enoughData
                  ? t('needThreeWeeks')
                  : stats.flatWeeks === 0
                    ? t('plateauNone')
                    : stats.flatWeeks < 3
                      ? t('plateauShort', { weeks: stats.flatWeeks })
                      : t('plateauReal', { weeks: stats.flatWeeks })}
              </p>
            </div>

            <div className="panel p-5">
              <h2 className="t-h3">{t('entries')}</h2>
              <ul className="mt-4 divide-y divide-[var(--line)]">
                {[...sorted].reverse().map((entry) => (
                  <li key={entry.recorded_on} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">
                        {toW(entry.weight_kg).toFixed(1)} {wUnit}
                      </span>
                      <span className="ml-3 text-sm text-muted">{entry.recorded_on}</span>
                      {entry.waist_cm && (
                        <span className="ml-3 text-sm text-muted">
                          {t('waist')}: {entry.waist_cm} {tc('cm')}
                        </span>
                      )}
                      {entry.note && (
                        <p className="text-xs text-muted truncate">{entry.note}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={t('delete')}
                      onClick={() =>
                        setEntries((prev) => prev.filter((e) => e.recorded_on !== entry.recorded_on))
                      }
                      className="p-1.5 rounded-lg hover:sunken text-muted shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
