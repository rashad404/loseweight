'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field, FormulaNote } from './shared';
import { AlertTriangle, Info } from 'lucide-react';
import {
  ACTIVITY_LEVELS, bmr, tdee, type Sex,
} from '@/lib/health/calculations';
import { kgToLb, lbToKg, type Units } from '@/lib/health/units';

export default function PlateauAnalyzer() {
  const t = useTranslations('calculators');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const ta = useTranslations('activity');

  const [units, setUnits] = useState<Units>('metric');
  const [sex, setSex] = useState<Sex>('female');
  const [age, setAge] = useState(35);
  const [heightCm, setHeightCm] = useState(168);
  const [startKg, setStartKg] = useState(88);
  const [currentKg, setCurrentKg] = useState(79);
  const [factor, setFactor] = useState(1.375);
  const [weeksFlat, setWeeksFlat] = useState(4);

  const isMetric = units === 'metric';
  const wUnit = isMetric ? tc('kg') : tc('lb');
  const toW = (kg: number) => (isMetric ? kg : kgToLb(kg));
  const fromW = (v: number) => (isMetric ? v : lbToKg(v));

  const analysis = useMemo(() => {
    const startTdee = tdee(bmr(sex, startKg, heightCm, age), factor);
    const nowTdee = tdee(bmr(sex, currentKg, heightCm, age), factor);
    const drop = Math.round(startTdee - nowTdee);
    const lost = startKg - currentKg;

    const real = weeksFlat >= 3;

    return {
      startTdee: Math.round(startTdee),
      nowTdee: Math.round(nowTdee),
      drop,
      lost,
      real,
    };
  }, [sex, age, heightCm, startKg, currentKg, factor, weeksFlat]);

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

        <Field label={tp('sex')}>
          <div className="segment">
            {(['female', 'male'] as Sex[]).map((s) => (
              <button key={s} type="button" data-active={sex === s} onClick={() => setSex(s)}>
                {tp(s)}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={tp('age')}>
            <input type="number" className="field" value={age}
              onChange={(e) => setAge(Number(e.target.value))} />
          </Field>
          <Field label={`${tp('height')} (${tc('cm')})`}>
            <input type="number" className="field" value={Math.round(heightCm)}
              onChange={(e) => setHeightCm(Number(e.target.value))} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t('startWeightAgo')} (${wUnit})`}>
            <input type="number" step="0.1" className="field" value={toW(startKg).toFixed(1)}
              onChange={(e) => setStartKg(fromW(Number(e.target.value)))} />
          </Field>
          <Field label={`${tp('currentWeight')} (${wUnit})`}>
            <input type="number" step="0.1" className="field" value={toW(currentKg).toFixed(1)}
              onChange={(e) => setCurrentKg(fromW(Number(e.target.value)))} />
          </Field>
        </div>

        <Field label={tp('activity')}>
          <select className="field" value={factor} onChange={(e) => setFactor(Number(e.target.value))}>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.id} value={level.factor}>{ta(level.id)}</option>
            ))}
          </select>
        </Field>

        <Field label={t('weeksFlat')}>
          <input type="number" className="field" min={0} max={52} value={weeksFlat}
            onChange={(e) => setWeeksFlat(Number(e.target.value))} />
        </Field>
      </div>

      <div className="space-y-5">
        <div className={`panel p-5 border-l-4`} style={{
          borderLeftColor: analysis.real ? 'var(--color-clay)' : 'var(--color-brand-500)',
        }}>
          <div className="flex gap-3">
            {analysis.real
              ? <AlertTriangle size={20} className="text-clay shrink-0 mt-0.5" />
              : <Info size={20} className="text-brand-800 shrink-0 mt-0.5" />}
            <div>
              <h2 className="t-h3">
                {analysis.real ? 'This counts as a plateau' : 'This is probably still normal fluctuation'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed">
                {analysis.real
                  ? `Your 7 day average has been flat for ${weeksFlat} weeks. Three or more flat weeks with unchanged adherence is the point where it means something.`
                  : `Your average has been flat for ${weeksFlat} ${weeksFlat === 1 ? 'week' : 'weeks'}. Day to day swings of 1 to 2 kg from water, sodium, and food in transit are larger than a week of real fat loss, so a short flat stretch usually says nothing. Wait until you have three or more flat weeks before changing anything.`}
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="t-h3">What changed since you started</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Weight lost so far</dt>
              <dd className="font-semibold">{toW(analysis.lost).toFixed(1)} {wUnit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Maintenance calories then</dt>
              <dd className="font-semibold">{analysis.startTdee.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Maintenance calories now</dt>
              <dd className="font-semibold">{analysis.nowTdee.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4 pt-3 border-t border-line">
              <dt className="font-semibold">Your deficit shrank by</dt>
              <dd className="font-bold text-clay">{analysis.drop} calories a day</dd>
            </div>
          </dl>

          {analysis.drop > 0 && (
            <p className="mt-4 text-sm leading-relaxed">
              If you are still eating what you ate at {toW(startKg).toFixed(1)} {wUnit}, your deficit is
              now {analysis.drop} calories a day smaller than it was. That alone can turn visible
              progress into an apparent stall, without anything going wrong metabolically.
            </p>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="t-h3">What to change, in order</h2>
          <ol className="mt-3 space-y-2.5 text-sm list-decimal pl-5 leading-relaxed">
            <li>Weigh daily and read only the 7 day average. Confirm the flat line over 21 days or more.</li>
            <li>Weigh your food for one week instead of estimating. Reported intake drifts upward over months, and the drift is invisible from the inside. This alone resolves a large share of stalls.</li>
            <li>Recalculate your calorie target at your current weight, not your starting weight. For you that means about {analysis.nowTdee.toLocaleString()} calories for maintenance.</li>
            <li>Add movement before subtracting food. Steps are easier to keep up than a smaller food budget.</li>
            <li>Only then cut 100 to 150 calories, and give it two weeks before judging.</li>
            <li>Consider two to four weeks at maintenance. It does not undo what you have lost, and it often restores the consistency that actually drives results.</li>
          </ol>
        </div>

        <FormulaNote title="What not to do">
          <p>Do not cut calories dramatically. Larger deficits cost more lean tissue and rarely survive contact with a normal week.</p>
          <p>Do not add hours of cardio. It raises appetite and eats into recovery, and the calories burned are usually smaller than people expect.</p>
          <p>Cutting out food groups or doing a cleanse does not address any mechanism that causes a plateau.</p>
          <p>One more possibility worth ruling out: if you recently started resistance training, you may be gaining muscle while losing fat. The scale hides that. Check your waist measurement and how your clothes fit before assuming nothing is happening.</p>
        </FormulaNote>
      </div>
    </div>
  );
}
