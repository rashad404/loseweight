'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Info } from 'lucide-react';
import ProjectionChart, { type Series } from './ProjectionChart';
import {
  ACTIVITY_LEVELS, CALORIE_FLOOR, KCAL_PER_KG,
  bmi, bmr, fiberTarget, healthyWeightRange, intakeForRate,
  projectWeightLoss, proteinTarget, suggestedRate, tdee, type Sex,
} from '@/lib/health/calculations';
import {
  cmToFeetInches, feetInchesToCm, kgToLb, lbToKg, type Units,
} from '@/lib/health/units';

interface Form {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goalKg: number;
  activityFactor: number;
  rate: number;
  units: Units;
}

const DEFAULTS: Form = {
  sex: 'female',
  age: 35,
  heightCm: 168,
  weightKg: 88,
  goalKg: 72,
  activityFactor: 1.375,
  rate: 0.6,
  units: 'metric',
};

export default function Planner() {
  const t = useTranslations('planner');
  const tc = useTranslations('common');
  const ta = useTranslations('activity');
  const [form, setForm] = useState<Form>(DEFAULTS);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const result = useMemo(() => {
    const { sex, age, heightCm, weightKg, goalKg, activityFactor, rate } = form;

    if (goalKg >= weightKg) return { error: 'goalAboveCurrent' as const };

    const bmrValue = bmr(sex, weightKg, heightCm, age);
    const maintenance = tdee(bmrValue, activityFactor);
    const { intake, clamped } = intakeForRate(maintenance, rate, sex);

    const projection = projectWeightLoss({
      sex, age, heightCm,
      startWeightKg: weightKg,
      goalWeightKg: goalKg,
      activityFactor,
      intake,
    });

    const protein = proteinTarget(weightKg, goalKg, heightCm, age);
    const range = healthyWeightRange(heightCm);

    const startDate = new Date();
    const targetDate = projection.weeksToGoal
      ? new Date(startDate.getTime() + projection.weeksToGoal * 7 * 86400000)
      : null;

    const milestones = [
      { key: 'milestone5', weight: weightKg * 0.95 },
      { key: 'milestone10', weight: weightKg * 0.9 },
      { key: 'milestoneHealthy', weight: range.max },
      { key: 'milestoneGoal', weight: goalKg },
    ]
      .filter((m) => m.weight < weightKg)
      .map((m) => {
        const hit = projection.points.find((p) => p.weightKg <= m.weight);
        return { ...m, week: hit?.week ?? null };
      });

    return {
      error: null,
      bmrValue: Math.round(bmrValue),
      maintenance: Math.round(maintenance),
      intake,
      deficit: Math.round(maintenance - intake),
      clamped,
      projection,
      protein,
      fiber: fiberTarget(intake),
      range,
      targetDate,
      milestones,
      goalBelowHealthy: goalKg < range.min,
    };
  }, [form]);

  const isMetric = form.units === 'metric';
  const wUnit = isMetric ? tc('kg') : tc('lb');
  const toDisplay = (kg: number) => (isMetric ? kg : kgToLb(kg));
  const fromDisplay = (v: number) => (isMetric ? v : lbToKg(v));
  const fmtWeight = (kg: number) => toDisplay(kg).toFixed(1);

  const feetInches = cmToFeetInches(form.heightCm);

  const chartSeries: Series[] = useMemo(() => {
    if (result.error) return [];
    const realistic: Series = {
      label: t('chartRealistic'),
      color: 'var(--color-brand-500)',
      points: result.projection.points.map((p) => ({
        week: p.week,
        weight: toDisplay(p.weightKg),
      })),
    };

    // The straight line a fixed-rate calculator would draw, for comparison.
    const weeks = result.projection.points[result.projection.points.length - 1].week;
    const naiveWeekly = (result.deficit * 7) / KCAL_PER_KG;
    const naive: Series = {
      label: t('chartNaive'),
      color: 'var(--text-muted)',
      dashed: true,
      points: Array.from({ length: weeks + 1 }, (_, w) => ({
        week: w,
        weight: toDisplay(Math.max(form.goalKg * 0.8, form.weightKg - naiveWeekly * w)),
      })),
    };

    return [realistic, naive];
  }, [result, form.units, form.goalKg, form.weightKg, t]);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
      <div className="panel p-5 lg:sticky lg:top-20">
        <h2 className="t-h3">{t('yourDetails')}</h2>

        <div className="mt-4 space-y-4">
          <div>
            <span className="field-label">{t('units')}</span>
            <div className="segment">
              {(['metric', 'imperial'] as Units[]).map((u) => (
                <button key={u} type="button" data-active={form.units === u} onClick={() => set('units', u)}>
                  {t(u)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">{t('sex')}</span>
            <div className="segment">
              {(['female', 'male'] as Sex[]).map((s) => (
                <button key={s} type="button" data-active={form.sex === s} onClick={() => set('sex', s)}>
                  {t(s)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">{t('sexNote')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="age">{t('age')}</label>
              <input
                id="age" type="number" className="field" min={16} max={100}
                value={form.age}
                onChange={(e) => set('age', Number(e.target.value))}
              />
            </div>

            {isMetric ? (
              <div>
                <label className="field-label" htmlFor="height">
                  {t('height')} ({tc('cm')})
                </label>
                <input
                  id="height" type="number" className="field" min={120} max={250}
                  value={Math.round(form.heightCm)}
                  onChange={(e) => set('heightCm', Number(e.target.value))}
                />
              </div>
            ) : (
              <div>
                <span className="field-label">{t('height')}</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" className="field" min={3} max={8}
                    aria-label={tc('ft')}
                    value={feetInches.feet}
                    onChange={(e) =>
                      set('heightCm', feetInchesToCm(Number(e.target.value), feetInches.inches))
                    }
                  />
                  <input
                    type="number" className="field" min={0} max={11}
                    aria-label={tc('in')}
                    value={Math.round(feetInches.inches)}
                    onChange={(e) =>
                      set('heightCm', feetInchesToCm(feetInches.feet, Number(e.target.value)))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="weight">
                {t('currentWeight')} ({wUnit})
              </label>
              <input
                id="weight" type="number" step="0.1" className="field"
                value={toDisplay(form.weightKg).toFixed(1)}
                onChange={(e) => set('weightKg', fromDisplay(Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="goal">
                {t('goalWeight')} ({wUnit})
              </label>
              <input
                id="goal" type="number" step="0.1" className="field"
                value={toDisplay(form.goalKg).toFixed(1)}
                onChange={(e) => set('goalKg', fromDisplay(Number(e.target.value)))}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="activity">{t('activity')}</label>
            <select
              id="activity" className="field"
              value={form.activityFactor}
              onChange={(e) => set('activityFactor', Number(e.target.value))}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level.id} value={level.factor}>
                  {ta(level.id)}: {ta(`${level.id}Desc`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="rate">
              {t('rate')}: {isMetric
                ? `${form.rate.toFixed(2)} ${tc('kg')}`
                : `${kgToLb(form.rate).toFixed(2)} ${tc('lb')}`} / {tc('weeks').slice(0, 4)}
            </label>
            <input
              id="rate" type="range" min={0.1} max={1} step={0.05}
              value={form.rate}
              onChange={(e) => set('rate', Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <p className="mt-1 text-xs text-muted">
              {ta('light')} {suggestedRate(bmi(form.weightKg, form.heightCm)).toFixed(2)} {tc('kg')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {result.error === 'goalAboveCurrent' ? (
          <div className="panel p-6 flex gap-3">
            <AlertTriangle size={20} className="text-clay shrink-0 mt-0.5" />
            <p className="text-sm">{t('goalAboveCurrent')}</p>
          </div>
        ) : (
          <>
            {result.goalBelowHealthy && (
              <div className="panel p-4 flex gap-3 border-l-4" style={{ borderLeftColor: 'var(--color-clay)' }}>
                <AlertTriangle size={18} className="text-clay shrink-0 mt-0.5" />
                <p className="text-sm">
                  {t('goalTooLow', { min: `${fmtWeight(result.range.min)} ${wUnit}` })}
                </p>
              </div>
            )}

            {result.clamped !== 'none' && (
              <div className="panel p-4 flex gap-3 border-l-4" style={{ borderLeftColor: 'var(--color-brand-500)' }}>
                <Info size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <p className="text-sm">
                  {result.clamped === 'floor'
                    ? t('clampedFloor', { floor: CALORIE_FLOOR[form.sex] })
                    : t('clampedDeficit')}
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t('dailyCalories')} value={result.intake} unit={tc('calories')} emphasis />
              <Stat label={t('maintenance')} value={result.maintenance} unit={tc('calories')} />
              <Stat label={t('deficit')} value={result.deficit} unit={tc('calories')} />
              <Stat label={t('bmr')} value={result.bmrValue} unit={tc('calories')} />
            </div>

            <div className="panel p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="t-h3">{t('chartTitle')}</h2>
                {result.targetDate && (
                  <p className="text-sm">
                    <span className="text-muted">{t('targetDate')}: </span>
                    <span className="font-semibold">
                      {result.targetDate.toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    <span className="text-muted">
                      {' '}({t('weeksToGoal', { weeks: result.projection.weeksToGoal! })})
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-4">
                <ProjectionChart
                  series={chartSeries}
                  goalWeight={toDisplay(form.goalKg)}
                  goalLabel={t('milestoneGoal')}
                  unitSuffix={wUnit}
                  weekLabel={(w) => t('week', { n: w })}
                  formatWeight={(v) => v.toFixed(1)}
                />
              </div>

              <p className="mt-4 text-sm text-muted">{t('chartNote')}</p>

              {!result.projection.goalReached && (
                <p className="mt-3 text-sm">
                  {t('plateauNote', {
                    weight: `${fmtWeight(result.projection.plateauWeightKg)} ${wUnit}`,
                  })}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="panel p-5">
                <h2 className="t-h3">{t('milestonesTitle')}</h2>
                <ul className="mt-4 space-y-3">
                  {result.milestones.map((m) => (
                    <li key={m.key} className="flex items-baseline justify-between gap-3 text-sm">
                      <span>
                        {t(m.key as 'milestone5')}
                        <span className="text-muted"> ({fmtWeight(m.weight)} {wUnit})</span>
                      </span>
                      <span className="font-semibold shrink-0">
                        {m.week === null ? (
                          <span className="text-muted font-normal">{t('notReached')}</span>
                        ) : (
                          t('week', { n: m.week })
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel p-5">
                <h2 className="t-h3">
                  {t('protein')} + {t('fiber')}
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {result.protein.low} to {result.protein.high} {tc('grams')}
                    </div>
                    <div className="text-sm text-muted">
                      {t('protein')} {t('perDay')}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {result.fiber} {tc('grams')}
                    </div>
                    <div className="text-sm text-muted">
                      {t('fiber')} {t('perDay')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="t-h3">{t('assumptionsTitle')}</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t('assumptions')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label, value, unit, emphasis,
}: { label: string; value: number; unit: string; emphasis?: boolean }) {
  return (
    <div
      className="panel p-4"
      style={emphasis ? { borderColor: 'var(--color-brand-500)', borderWidth: 2 } : undefined}
    >
      <div className="text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-muted">
        {label}
      </div>
      <div className={`mt-2 t-num ${emphasis ? 'text-[2.125rem] text-brand-600' : 'text-[1.625rem]'}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-[0.75rem] text-muted">{unit}</div>
    </div>
  );
}
