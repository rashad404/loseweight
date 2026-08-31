'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field, FormulaNote, ResultCard, ScaleBar } from './shared';
import { bmi, bmiCategory, healthyWeightRange } from '@/lib/health/calculations';
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg, type Units } from '@/lib/health/units';

export default function BmiCalculator() {
  const t = useTranslations('calculators');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const tb = useTranslations('bmiCategory');

  const [units, setUnits] = useState<Units>('metric');
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(78);

  const isMetric = units === 'metric';
  const fi = cmToFeetInches(heightCm);

  const value = useMemo(() => bmi(weightKg, heightCm), [weightKg, heightCm]);
  const category = bmiCategory(value);
  const range = healthyWeightRange(heightCm);
  const fmt = (kg: number) => (isMetric ? kg : kgToLb(kg)).toFixed(1);
  const wUnit = isMetric ? tc('kg') : tc('lb');

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
      <div className="panel p-5 space-y-4">
        <Field label={tp('units')}>
          <div className="segment">
            {(['metric', 'imperial'] as Units[]).map((u) => (
              <button key={u} type="button" data-active={units === u} onClick={() => setUnits(u)}>
                {tp(u)}
              </button>
            ))}
          </div>
        </Field>

        {isMetric ? (
          <Field label={`${tp('height')} (${tc('cm')})`}>
            <input type="number" className="field" value={Math.round(heightCm)}
              onChange={(e) => setHeightCm(Number(e.target.value))} min={120} max={250} />
          </Field>
        ) : (
          <Field label={tp('height')}>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="field" aria-label={tc('ft')} value={fi.feet}
                onChange={(e) => setHeightCm(feetInchesToCm(Number(e.target.value), fi.inches))} />
              <input type="number" className="field" aria-label={tc('in')} value={Math.round(fi.inches)}
                onChange={(e) => setHeightCm(feetInchesToCm(fi.feet, Number(e.target.value)))} />
            </div>
          </Field>
        )}

        <Field label={`${tp('currentWeight')} (${wUnit})`}>
          <input type="number" step="0.1" className="field"
            value={(isMetric ? weightKg : kgToLb(weightKg)).toFixed(1)}
            onChange={(e) =>
              setWeightKg(isMetric ? Number(e.target.value) : lbToKg(Number(e.target.value)))
            } />
        </Field>
      </div>

      <div className="space-y-5">
        <div className="panel p-5">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide">
            {t('yourResult')}
          </div>
          <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-brand-600">{value.toFixed(1)}</span>
            <span className="text-lg font-semibold">{tb(category)}</span>
          </div>

          <ScaleBar
            value={Math.min(value, 42)} min={15} max={42}
            stops={[
              { at: 18.5, label: 'under', color: '#8593a6' },
              { at: 25, label: 'healthy', color: 'var(--color-brand-500)' },
              { at: 30, label: 'over', color: '#e8b93a' },
              { at: 42, label: 'obese', color: 'var(--color-clay)' },
            ]}
          />
        </div>

        <ResultCard
          label={tp('milestoneHealthy')}
          value={`${fmt(range.min)} to ${fmt(range.max)}`}
          unit={wUnit}
          note="This is the weight range that maps to a BMI of 18.5 to 24.9 at your height. It is a range, not a single correct number."
          tone="neutral"
        />

        <FormulaNote title={t('formula')}>
          <p>BMI = weight in kg divided by height in meters squared.</p>
          <p>BMI works well for comparing groups of people, which is why public health research uses it. For one person it is blunt: it cannot tell muscle from fat, and it says nothing about where fat sits on your body. A muscular athlete and someone carrying visceral fat can share a BMI and have very different risk.</p>
          <p>The standard cutoffs were derived mostly from populations of European ancestry. Risk rises at lower BMI values in South Asian, Chinese, and several other Asian populations, and many national guidelines use 23 rather than 25 as the overweight threshold there.</p>
          <p>If you want one number that tracks individual risk better, measure your waist and use the waist to height ratio instead.</p>
        </FormulaNote>
      </div>
    </div>
  );
}
