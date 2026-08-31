'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Field, FormulaNote, ResultCard } from './shared';
import {
  ACTIVITY_LEVELS, bmi, bmr, fiberTarget, intakeForRate, proteinTarget, tdee, type Sex,
} from '@/lib/health/calculations';
import { kgToLb, lbToKg, type Units } from '@/lib/health/units';

export default function ProteinCalculator() {
  const t = useTranslations('calculators');
  const tp = useTranslations('planner');
  const tc = useTranslations('common');
  const ta = useTranslations('activity');

  const [units, setUnits] = useState<Units>('metric');
  const [sex, setSex] = useState<Sex>('female');
  const [age, setAge] = useState(35);
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(88);
  const [goalKg, setGoalKg] = useState(72);
  const [factor, setFactor] = useState(1.375);

  const isMetric = units === 'metric';
  const wUnit = isMetric ? tc('kg') : tc('lb');
  const toW = (kg: number) => (isMetric ? kg : kgToLb(kg));
  const fromW = (v: number) => (isMetric ? v : lbToKg(v));

  const result = useMemo(() => {
    const maintenance = tdee(bmr(sex, weightKg, heightCm, age), factor);
    const { intake } = intakeForRate(maintenance, 0.5, sex);
    const protein = proteinTarget(weightKg, goalKg, heightCm, age);
    return {
      protein,
      fiber: fiberTarget(intake),
      intake,
      bmiValue: bmi(weightKg, heightCm),
    };
  }, [sex, age, heightCm, weightKg, goalKg, factor]);

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
              onChange={(e) => setAge(Number(e.target.value))} min={16} max={100} />
          </Field>
          <Field label={`${tp('height')} (${tc('cm')})`}>
            <input type="number" className="field" value={Math.round(heightCm)}
              onChange={(e) => setHeightCm(Number(e.target.value))} min={120} max={250} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`${tp('currentWeight')} (${wUnit})`}>
            <input type="number" step="0.1" className="field" value={toW(weightKg).toFixed(1)}
              onChange={(e) => setWeightKg(fromW(Number(e.target.value)))} />
          </Field>
          <Field label={`${tp('goalWeight')} (${wUnit})`}>
            <input type="number" step="0.1" className="field" value={toW(goalKg).toFixed(1)}
              onChange={(e) => setGoalKg(fromW(Number(e.target.value)))} />
          </Field>
        </div>

        <Field label={tp('activity')}>
          <select className="field" value={factor} onChange={(e) => setFactor(Number(e.target.value))}>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.id} value={level.factor}>{ta(level.id)}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultCard
            label={tp('protein')}
            value={`${result.protein.low} to ${result.protein.high}`}
            unit={tc('grams')}
            note={
              result.protein.basis === 'goal'
                ? `Scaled to your goal weight of ${toW(goalKg).toFixed(1)} ${wUnit} rather than your current weight, which is standard practice above a BMI of 30. Scaling to current weight at higher BMIs produces targets most people cannot eat.`
                : `Scaled to your current weight at 1.6 to ${age >= 65 ? '2.0' : '2.2'} g per kg.`
            }
          />
          <ResultCard
            label={tp('fiber')}
            value={String(result.fiber)}
            unit={tc('grams')}
            tone="neutral"
            note={`Based on roughly ${result.intake.toLocaleString()} calories a day at a moderate deficit. Fiber scales with how much you eat, not with body size.`}
          />
        </div>

        <div className="panel p-5">
          <h2 className="t-h3">Spreading it across the day</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Muscle responds to roughly 25 to 40 g of protein at a time. Three or four meals
            in that range work better than one large serving at dinner. For your target,
            that is about {Math.round(result.protein.low / 3.5)} to {Math.round(result.protein.high / 3.5)} g
            at each of four meals.
          </p>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            For reference: 150 g of chicken breast has about 46 g, 200 g of Greek yogurt about 20 g,
            a cup of cooked lentils about 18 g, two eggs about 12 g, and 150 g of firm tofu about 17 g.
          </p>
        </div>

        <p className="text-[0.9375rem]">
          <Link href="/guides/protein-targets" className="text-brand-800 font-medium hover:underline">
            How much protein you need, and how to spread it across the day
          </Link>
        </p>

        <FormulaNote title={t('formula')}>
          <p>Your BMI is {result.bmiValue.toFixed(1)}, so the target is scaled to your {result.protein.basis === 'goal' ? 'goal' : 'current'} weight.</p>
          <p>Higher protein intakes during weight loss preserve more lean tissue and reduce hunger at the same calorie intake. The 0.8 g/kg figure you may have seen is a minimum for preventing deficiency in sedentary people, not a target for someone in a deficit.</p>
          <p>If you have kidney disease, do not use this number. Protein intake in that situation has to be set by the clinician managing your condition. In people with healthy kidneys, intakes in this range have not been shown to cause harm.</p>
          <p>Fiber target is about 14 g per 1,000 calories. Increase intake by roughly 5 g a week rather than all at once, and drink more water alongside it, or you will get bloating instead of benefit.</p>
        </FormulaNote>
      </div>
    </div>
  );
}
