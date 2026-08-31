'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Field, FieldGroup, FormulaNote, ScaleBar } from './shared';
import NumberField from './NumberField';
import { waistToHeight, whtrCategory } from '@/lib/health/calculations';
import { cmToIn, inToCm, type Units } from '@/lib/health/units';

export default function WaistCalculator() {
  const t = useTranslations('calculators');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const tw = useTranslations('whtrCategory');

  const [units, setUnits] = useState<Units>('metric');
  const [heightCm, setHeightCm] = useState(168);
  const [waistCm, setWaistCm] = useState(88);

  const isMetric = units === 'metric';
  const lUnit = isMetric ? tc('cm') : tc('in');
  const toLen = (cm: number) => (isMetric ? cm : cmToIn(cm));
  const fromLen = (v: number) => (isMetric ? v : inToCm(v));

  const ratio = useMemo(() => waistToHeight(waistCm, heightCm), [waistCm, heightCm]);
  const category = whtrCategory(ratio);
  const targetWaist = heightCm * 0.5;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
      <div className="panel p-5 space-y-4">
        <FieldGroup label={tp('units')}>
            <div className="segment">
            {(['metric', 'imperial'] as Units[]).map((u) => (
              <button key={u} type="button" data-active={units === u} onClick={() => setUnits(u)}>
                {tp(u)}
              </button>
            ))}
          </div>
          </FieldGroup>

        <Field label={`${tp('height')} (${lUnit})`}>
            {(p) => (
              <NumberField {...p} decimals={isMetric ? 0 : 1}
            value={toLen(heightCm)}
            onCommit={(n) => setHeightCm(fromLen(n))} />
            )}
          </Field>

        <Field label={`${t('enterWaist')} (${lUnit})`} hint={t('waistHelp')}>
            {(p) => (
              <NumberField {...p}
            value={toLen(waistCm)}
            onCommit={(n) => setWaistCm(fromLen(n))} />
            )}
          </Field>
      </div>

      <div className="space-y-5">
        <div className="panel p-5">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide">
            {t('yourResult')}
          </div>
          <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-brand-800">{ratio.toFixed(2)}</span>
            <span className="text-lg font-semibold">{tw(category)}</span>
          </div>

          <ScaleBar
            value={Math.min(ratio, 0.75) * 100} min={30} max={75}
            stops={[
              { at: 40, label: 'low', color: '#8593a6' },
              { at: 50, label: 'healthy', color: 'var(--color-brand-500)' },
              { at: 60, label: 'increased', color: '#e8b93a' },
              { at: 75, label: 'high', color: 'var(--color-clay)' },
            ]}
          />

          <p className="mt-4 text-sm leading-relaxed">
            Keep your waist under half your height. At {toLen(heightCm).toFixed(isMetric ? 0 : 1)} {lUnit} tall,
            that means a waist under {toLen(targetWaist).toFixed(1)} {lUnit}.
            {ratio >= 0.5 && ` You are currently ${toLen(waistCm - targetWaist).toFixed(1)} ${lUnit} above that.`}
          </p>
        </div>

        <p className="text-[0.9375rem]">
          <Link href="/guides/bmi-waist-body-fat" className="text-brand-800 font-medium hover:underline">
            How waist to height compares with BMI and body fat percentage
          </Link>
        </p>

        <FormulaNote title={t('formula')}>
          <p>Waist to height ratio = waist circumference divided by height, in the same units.</p>
          <p>This measures what matters more than total weight: fat stored around the organs, which is more strongly linked to cardiometabolic disease than fat stored under the skin. It predicts individual risk better than BMI, works without separate cutoffs for different ethnic groups, and needs nothing but a tape measure.</p>
          <p>One caveat worth knowing: measurement technique matters. Pulling the tape tight, measuring at the navel instead of the correct landmark, or measuring after a large meal can all shift the number by a few centimeters. Measure the same way each time and compare against your own previous readings.</p>
          <p>The ratio has not been validated for children under 6, during pregnancy, or in people with conditions that cause abdominal swelling.</p>
        </FormulaNote>
      </div>
    </div>
  );
}
