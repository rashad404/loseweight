'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { Field, FieldGroup } from '@/components/tools/shared';
import NumberField from '@/components/tools/NumberField';
import {
  ACTIVITY_LEVELS, bmi, bmr, intakeForRate, projectWeightLoss, suggestedRate, tdee, type Sex,
} from '@/lib/health/calculations';
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg, type Units } from '@/lib/health/units';
import { DRAFT_KEY } from '@/lib/plan/storage';

/**
 * The homepage is the product, not a description of it. This computes a real
 * result as you type, from the same engine the planner uses, so the first thing
 * a visitor sees is their own number rather than a mocked-up dashboard.
 *
 * Inputs are carried to the full planner through localStorage rather than the
 * URL, because body measurements do not belong in a query string, browser
 * history, or a referrer header.
 */
export default function QuickStart() {
  const t = useTranslations('home');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const ta = useTranslations('activity');
  const router = useRouter();

  const [units, setUnits] = useState<Units>('metric');
  const [sex, setSex] = useState<Sex>('female');
  const [age, setAge] = useState(35);
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(88);
  const [goalKg, setGoalKg] = useState(72);
  const [activityFactor, setActivityFactor] = useState(1.375);
  const [calculationStartedAt, setCalculationStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setCalculationStartedAt(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);

  const isMetric = units === 'metric';
  const wUnit = isMetric ? tc('kg') : tc('lb');
  const toW = (kg: number) => (isMetric ? kg : kgToLb(kg));
  const fromW = (v: number) => (isMetric ? v : lbToKg(v));
  const fi = cmToFeetInches(heightCm);

  const result = useMemo(() => {
    if (goalKg >= weightKg) return null;

    const maintenance = tdee(bmr(sex, weightKg, heightCm, age), activityFactor);
    const rate = suggestedRate(bmi(weightKg, heightCm));
    const { intake } = intakeForRate(maintenance, rate, sex);
    const projection = projectWeightLoss({
      sex, age, heightCm, startWeightKg: weightKg, goalWeightKg: goalKg, activityFactor, intake,
    });

    const target = projection.weeksToGoal && calculationStartedAt
      ? new Date(calculationStartedAt + projection.weeksToGoal * 7 * 86_400_000)
      : null;

    return {
      maintenance: Math.round(maintenance),
      intake,
      rate,
      weeks: projection.weeksToGoal,
      naiveWeeks: projection.naiveWeeksToGoal,
      plateau: projection.plateauWeightKg,
      target,
      points: projection.points,
    };
  }, [sex, age, heightCm, weightKg, goalKg, activityFactor, calculationStartedAt]);

  const openPlanner = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        sex, age, heightCm, weightKg, goalKg, activityFactor, units,
        rate: result?.rate ?? suggestedRate(bmi(weightKg, heightCm)),
      }));
    } catch {
      // The planner just falls back to its defaults.
    }
    router.push('/planner');
  };

  // Small inline sparkline of the real projection.
  const spark = useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const pts = result.points;
    const step = Math.max(1, Math.floor(pts.length / 40));
    const s = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
    const lo = Math.min(...s.map((p) => p.weightKg));
    const hi = Math.max(...s.map((p) => p.weightKg));
    const last = s[s.length - 1].week || 1;
    return s.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${((p.week / last) * 300).toFixed(1)} ${(56 - ((p.weightKg - lo) / (hi - lo || 1)) * 48).toFixed(1)}`,
    ).join(' ');
  }, [result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 items-start">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); openPlanner(); }}>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label={tp('units')}>
            <div className="segment">
              {(['metric', 'imperial'] as Units[]).map((u) => (
                <button key={u} type="button" data-active={units === u} onClick={() => setUnits(u)}>
                  {isMetric || u === 'imperial' ? (u === 'metric' ? tc('kg') : tc('lb')) : tc('lb')}
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label={tp('sex')}>
            <div className="segment">
              {(['female', 'male'] as Sex[]).map((s) => (
                <button key={s} type="button" data-active={sex === s} onClick={() => setSex(s)}>
                  {tp(s)}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={tp('age')}>
            {(p) => (
              <NumberField {...p} decimals={0} value={age} onCommit={(n) => setAge(n)} />
            )}
          </Field>

          {isMetric ? (
            <Field label={`${tp('height')} (${tc('cm')})`}>
              {(p) => (
                <NumberField {...p} decimals={0} value={heightCm} onCommit={(n) => setHeightCm(n)} />
              )}
            </Field>
          ) : (
            <FieldGroup label={tp('height')}>
              <div className="grid grid-cols-2 gap-2">
                <NumberField decimals={0} aria-label={tc('ft')} value={fi.feet} onCommit={(n) => setHeightCm(feetInchesToCm(n, fi.inches))} />
                <NumberField decimals={0} aria-label={tc('in')} value={fi.inches} onCommit={(n) => setHeightCm(feetInchesToCm(fi.feet, n))} />
              </div>
            </FieldGroup>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`${tp('currentWeight')} (${wUnit})`}>
            {(p) => (
              <NumberField {...p} value={toW(weightKg)} onCommit={(n) => setWeightKg(fromW(n))} />
            )}
          </Field>
          <Field label={`${tp('goalWeight')} (${wUnit})`}>
            {(p) => (
              <NumberField {...p} value={toW(goalKg)} onCommit={(n) => setGoalKg(fromW(n))} />
            )}
          </Field>
        </div>

        <Field label={tp('activity')}>
          {(p) => (
            <select {...p} className="field" value={activityFactor}
              onChange={(e) => setActivityFactor(Number(e.target.value))}>
              {ACTIVITY_LEVELS.map((l) => (
                <option key={l.id} value={l.factor}>{ta(l.id)}: {ta(`${l.id}Desc`)}</option>
              ))}
            </select>
          )}
        </Field>

        <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto">
          {t('quickCta')}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      <div className="panel p-5 sm:p-6" aria-live="polite">
        {!result ? (
          <p className="text-[0.9375rem] text-muted">{t('quickGoalHigh')}</p>
        ) : (
          <>
            {spark && (
              <svg viewBox="0 0 300 60" className="w-full h-auto mb-5" aria-hidden="true">
                <path d={`${spark} L 300 60 L 0 60 Z`} fill="var(--color-brand-500)" opacity={0.1} />
                <path d={spark} fill="none" stroke="var(--color-brand-600)" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            {result.weeks && result.target ? (
              <>
                <p className="text-[0.9375rem] text-muted">
                  {t('quickResultLead', { goal: `${toW(goalKg).toFixed(1)} ${wUnit}` })}
                </p>
                <p className="mt-1 t-num text-[1.75rem] text-brand-800">
                  {result.target.toLocaleString(undefined, { year: 'numeric', month: 'long' })}
                </p>
                <p className="text-[0.875rem] text-muted">
                  {t('quickWeeks', { weeks: result.weeks })}
                </p>
                {result.naiveWeeks && result.naiveWeeks < result.weeks && (
                  <p className="mt-3 text-[0.8125rem] text-muted leading-relaxed">
                    {t('quickNaive', { weeks: result.naiveWeeks })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[0.9375rem]">
                {t('quickNotReached', { weight: `${toW(result.plateau).toFixed(1)} ${wUnit}` })}
              </p>
            )}

            <dl className="mt-5 pt-4 border-t border-line grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[0.75rem] text-muted">{t('quickCalories')}</dt>
                <dd className="t-num text-[1.375rem]">{result.intake.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] text-muted">{t('quickMaintenance')}</dt>
                <dd className="t-num text-[1.375rem]">{result.maintenance.toLocaleString()}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
