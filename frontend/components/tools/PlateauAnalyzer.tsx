'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { FormulaNote } from './shared';
import { bmr, tdee } from '@/lib/health/calculations';
import { kgToLb } from '@/lib/health/units';
import {
  ENTRIES_CHANGED, PLAN_CHANGED, loadEntries, loadPlan,
  type SavedPlan, type WeightEntry,
} from '@/lib/plan/storage';
import { analyzeStall, summarize } from '@/lib/plan/analysis';

/**
 * Reads the tracker instead of asking the visitor how many weeks their average
 * has been flat. That question was the analysis, so asking it pushed the actual
 * work back onto the person least equipped to do it.
 *
 * It never opens by telling anyone to eat less. Measurement error and a
 * shrinking maintenance are both far more common than needing a deeper deficit.
 */
export default function PlateauAnalyzer() {
  const t = useTranslations('calculators');
  const tc = useTranslations('common');

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [context, setContext] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => { setEntries(loadEntries()); setPlan(loadPlan()); };
    const id = requestAnimationFrame(sync);
    window.addEventListener(ENTRIES_CHANGED, sync);
    window.addEventListener(PLAN_CHANGED, sync);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(ENTRIES_CHANGED, sync);
      window.removeEventListener(PLAN_CHANGED, sync);
    };
  }, []);

  const stall = useMemo(() => analyzeStall(entries, plan), [entries, plan]);
  const progress = useMemo(() => summarize(entries, plan), [entries, plan]);

  const metric = plan?.units !== 'imperial';
  const wUnit = metric ? tc('kg') : tc('lb');
  const rate = (kg: number) => `${Math.abs(metric ? kg : kgToLb(kg)).toFixed(2)} ${wUnit}`;

  const maintenanceNow = useMemo(() => {
    if (!plan || !progress) return null;
    return Math.round(
      tdee(bmr(plan.sex, progress.latest.averageKg, plan.heightCm, plan.age), plan.activityFactor),
    );
  }, [plan, progress]);

  if (entries.length === 0) {
    return (
      <section className="panel p-6 max-w-[62ch]">
        <h2 className="t-h3">{t('plateauFromData')}</h2>
        <p className="mt-2 text-[0.9375rem] text-muted leading-relaxed">{t('plateauNeedsData')}</p>
        <Link href="/tracker" className="btn btn-primary mt-4">{t('openTracker')}</Link>
      </section>
    );
  }

  const verdicts = {
    'insufficient-data': {
      title: t('vInsufficient'),
      why: t('vInsufficientWhy', { days: Math.round(stall.observationDays) }),
      tone: 'info' as const,
    },
    'sparse-data': {
      title: t('vSparse'),
      why: t('vSparseWhy', {
        perWeek: stall.entriesPerWeek.toFixed(1),
        days: Math.round(stall.observationDays),
      }),
      tone: 'info' as const,
    },
    'on-track': {
      title: t('vOnTrack'),
      why: t('vOnTrackWhy', { rate: rate(stall.slopeKgPerWeek ?? 0) }),
      tone: 'good' as const,
    },
    'normal-fluctuation': {
      title: t('vNormal'),
      why: t('vNormalWhy', { weeks: stall.flatWeeks }),
      tone: 'info' as const,
    },
    'slower-than-planned': {
      title: t('vSlower'),
      why: t('vSlowerWhy', {
        rate: rate(stall.slopeKgPerWeek ?? 0),
        planned: rate(plan?.rateKgPerWeek ?? 0),
      }),
      tone: 'warn' as const,
    },
    plateau: {
      title: t('vPlateau'),
      why: t('vPlateauWhy', { weeks: stall.flatWeeks }),
      tone: 'warn' as const,
    },
  };

  const v = verdicts[stall.verdict];
  const actionable = stall.verdict === 'plateau' || stall.verdict === 'slower-than-planned';
  const anyContext = Object.values(context).some(Boolean);

  const steps = [
    t('stepData'),
    t('stepMeasure'),
    t('stepActivity'),
    maintenanceNow ? t('stepRecalc', { maintenance: maintenanceNow.toLocaleString() }) : null,
    t('stepAdjust'),
    t('stepProfessional'),
  ].filter(Boolean) as string[];

  const contextOptions = [
    { id: 'cycle', label: t('ctxCycle') },
    { id: 'illness', label: t('ctxIllness') },
    { id: 'sodium', label: t('ctxSodium') },
    { id: 'training', label: t('ctxTraining') },
  ];

  return (
    <div className="space-y-5 max-w-[70ch]">
      <section
        className="panel p-5 border-l-4"
        style={{
          borderLeftColor:
            v.tone === 'warn' ? 'var(--color-clay)'
            : v.tone === 'good' ? 'var(--color-brand-500)'
            : 'var(--color-violet-500)',
        }}
        aria-labelledby="verdict"
      >
        <div className="flex gap-3">
          {v.tone === 'warn' ? <AlertTriangle size={20} className="text-clay shrink-0 mt-0.5" aria-hidden="true" />
            : v.tone === 'good' ? <CheckCircle2 size={20} className="text-brand-800 shrink-0 mt-0.5" aria-hidden="true" />
            : <Info size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--color-violet-500)' }} aria-hidden="true" />}
          <div>
            <h2 id="verdict" className="t-h3">{v.title}</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed">{v.why}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3 text-[0.875rem]">
          <div>
            <dt className="text-muted">{t('weeksFlat')}</dt>
            <dd className="t-num text-[1.25rem]">{stall.flatWeeks}</dd>
          </div>
          <div>
            <dt className="text-muted">{tc('weeks')}</dt>
            <dd className="t-num text-[1.25rem]">{(stall.observationDays / 7).toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('plateauFromData')}</dt>
            <dd className="t-num text-[1.25rem]">{stall.entriesPerWeek.toFixed(1)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel p-5" aria-labelledby="context">
        <h2 id="context" className="t-h3">{t('contextTitle')}</h2>
        <p className="mt-1.5 text-[0.875rem] text-muted">{t('contextHint')}</p>

        <div className="mt-4 space-y-2.5">
          {contextOptions.map((opt) => (
            <label key={opt.id} className="flex items-start gap-2.5 text-[0.9375rem] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(context[opt.id])}
                onChange={(e) => setContext((c) => ({ ...c, [opt.id]: e.target.checked }))}
                className="mt-1 accent-brand-600 h-4 w-4 shrink-0"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        {anyContext && (
          <p className="mt-4 notice text-[0.875rem] leading-relaxed">{t('ctxNote')}</p>
        )}
      </section>

      {actionable && (
        <section className="panel p-5" aria-labelledby="steps">
          <h2 id="steps" className="t-h3">{t('whatToCheck')}</h2>
          <ol className="mt-3 space-y-2.5 text-[0.9375rem] list-decimal pl-5 leading-relaxed">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      )}

      <FormulaNote title={t('formula')}>
        <p>
          The verdict comes from your saved weigh-ins: a trailing 7 day average, a
          least-squares slope through it, and the number of consecutive trailing weeks
          where that average has not fallen by more than 0.2 kg.
        </p>
        <p>
          Under 21 days of data, or fewer than three weigh-ins a week, it reports that
          rather than guessing. A 7 day average built from one reading a week is not an
          average.
        </p>
        <p>
          It does not open by suggesting fewer calories. Measurement drift and a
          maintenance level that fell with your weight are both more common explanations,
          and both are fixed without eating less.
        </p>
      </FormulaNote>
    </div>
  );
}
