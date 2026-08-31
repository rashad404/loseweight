'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Field, FieldGroup, FormulaNote, ResultCard } from './shared';
import {
  ACTIVITY_LEVELS, bmr, bmrFromLeanMass, tdee, type Sex,
} from '@/lib/health/calculations';
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg, type Units } from '@/lib/health/units';

export default function TdeeCalculator() {
  const t = useTranslations('calculators');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const ta = useTranslations('activity');

  const [units, setUnits] = useState<Units>('metric');
  const [sex, setSex] = useState<Sex>('female');
  const [age, setAge] = useState(35);
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(75);
  const [factor, setFactor] = useState(1.375);
  const [bodyFat, setBodyFat] = useState<string>('');

  const isMetric = units === 'metric';
  const fi = cmToFeetInches(heightCm);

  const result = useMemo(() => {
    const bf = parseFloat(bodyFat);
    const useKatch = !Number.isNaN(bf) && bf > 3 && bf < 70;
    const bmrValue = useKatch
      ? bmrFromLeanMass(weightKg, bf)
      : bmr(sex, weightKg, heightCm, age);
    const total = tdee(bmrValue, factor);

    // Split the non-resting portion the way the literature usually apportions it.
    const tef = total * 0.1;
    const activity = total - bmrValue - tef;
    const exercise = factor > 1.2 ? activity * 0.4 : 0;
    const neat = activity - exercise;

    return {
      bmr: Math.round(bmrValue),
      total: Math.round(total),
      tef: Math.round(tef),
      neat: Math.round(Math.max(neat, 0)),
      exercise: Math.round(Math.max(exercise, 0)),
      useKatch,
    };
  }, [sex, age, heightCm, weightKg, factor, bodyFat]);

  const components = [
    { key: 'componentBmr', value: result.bmr, color: 'var(--color-brand-600)' },
    { key: 'componentNeat', value: result.neat, color: 'var(--color-brand-400)' },
    { key: 'componentTef', value: result.tef, color: 'var(--color-brand-300)' },
    { key: 'componentExercise', value: result.exercise, color: 'var(--color-clay)' },
  ].filter((c) => c.value > 0);

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

        <FieldGroup label={tp('sex')} hint={tp('sexNote')}>
            <div className="segment">
            {(['female', 'male'] as Sex[]).map((s) => (
              <button key={s} type="button" data-active={sex === s} onClick={() => setSex(s)}>
                {tp(s)}
              </button>
            ))}
          </div>
          </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <Field label={tp('age')}>
            {(p) => (
              <input {...p} type="number" inputMode="decimal" className="field" value={age}
                onChange={(e) => setAge(Number(e.target.value))} min={16} max={100} />
            )}
          </Field>
          <Field label={`${tp('currentWeight')} (${isMetric ? tc('kg') : tc('lb')})`}>
            {(p) => (
              <input {...p} type="number" inputMode="decimal" step="0.1" className="field"
              value={(isMetric ? weightKg : kgToLb(weightKg)).toFixed(1)}
              onChange={(e) =>
                setWeightKg(isMetric ? Number(e.target.value) : lbToKg(Number(e.target.value)))
              } />
            )}
          </Field>
        </div>

        {isMetric ? (
          <Field label={`${tp('height')} (${tc('cm')})`}>
            {(p) => (
              <input {...p} type="number" inputMode="decimal" className="field" value={Math.round(heightCm)}
              onChange={(e) => setHeightCm(Number(e.target.value))} min={120} max={250} />
            )}
          </Field>
        ) : (
          <FieldGroup label={tp('height')}>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="field" aria-label={tc('ft')} value={fi.feet}
                onChange={(e) => setHeightCm(feetInchesToCm(Number(e.target.value), fi.inches))} />
              <input type="number" className="field" aria-label={tc('in')} value={Math.round(fi.inches)}
                onChange={(e) => setHeightCm(feetInchesToCm(fi.feet, Number(e.target.value)))} />
            </div>
          </FieldGroup>
        )}

        <Field label={tp('activity')}>
            {(p) => (
              <select {...p} className="field" value={factor} onChange={(e) => setFactor(Number(e.target.value))}>
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level.id} value={level.factor}>
                  {ta(level.id)}: {ta(`${level.id}Desc`)}
                </option>
              ))}
            </select>
            )}
          </Field>

        <Field label={t('bodyFat')} hint={t('bodyFatHelp')}>
            {(p) => (
              <input {...p} type="number" inputMode="decimal" step="0.1" className="field" value={bodyFat} placeholder="24"
              onChange={(e) => setBodyFat(e.target.value)} min={3} max={70} />
            )}
          </Field>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultCard label={tp('maintenance')} value={result.total.toLocaleString()} unit={tc('calories')} />
          <ResultCard label={tp('bmr')} value={result.bmr.toLocaleString()} unit={tc('calories')} tone="neutral" />
        </div>

        <div className="panel p-5">
          <h2 className="t-h3">{t('componentsTitle')}</h2>
          <div className="mt-4 flex h-3 rounded-full overflow-hidden">
            {components.map((c) => (
              <div key={c.key} style={{ width: `${(c.value / result.total) * 100}%`, background: c.color }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {components.map((c) => (
              <li key={c.key} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {t(c.key as 'componentBmr')}
                </span>
                <span className="font-semibold">
                  {c.value.toLocaleString()} {tc('calories')}
                  <span className="ml-2 text-muted font-normal">
                    {Math.round((c.value / result.total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[0.9375rem]">
          <Link href="/guides/tdee-explained" className="text-brand-800 font-medium hover:underline">
            What TDEE is made of, and how much to trust the estimate
          </Link>
        </p>

        <FormulaNote title={t('formula')}>
          {result.useKatch ? (
            <p>Katch-McArdle: BMR = 370 + (21.6 x lean body mass in kg). Used because you entered a body fat percentage, which makes the estimate more accurate than a height and weight equation.</p>
          ) : (
            <p>
              Mifflin-St Jeor: BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age)
              {sex === 'male' ? ' + 5' : ' - 161'}.
            </p>
          )}
          <p>TDEE = BMR x {factor}. The split below the total is an approximation: about 10% of the total goes to digesting food, and the rest of the non-resting portion is divided between deliberate exercise and everyday movement.</p>
          <p>{tp('assumptions')}</p>
        </FormulaNote>
      </div>
    </div>
  );
}
