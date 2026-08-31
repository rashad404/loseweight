import { getTranslations } from 'next-intl/server';
import {
  bmr, fiberTarget, intakeForRate, projectWeightLoss, proteinTarget, tdee,
} from '@/lib/health/calculations';

/**
 * A real worked example, computed with the same engine the planner uses, so the
 * hero shows the product's actual output instead of a stock illustration.
 * The inputs match the example used in the timeline guide.
 */
const EXAMPLE = {
  sex: 'female' as const,
  age: 35,
  heightCm: 168,
  startWeightKg: 88,
  goalWeightKg: 72,
  activityFactor: 1.375,
  rateKgPerWeek: 0.55,
};

export default async function HeroExample({ lang }: { lang: string }) {
  const t = await getTranslations({ locale: lang, namespace: 'planner' });
  const tc = await getTranslations({ locale: lang, namespace: 'common' });

  const maintenance = tdee(
    bmr(EXAMPLE.sex, EXAMPLE.startWeightKg, EXAMPLE.heightCm, EXAMPLE.age),
    EXAMPLE.activityFactor,
  );
  const { intake } = intakeForRate(maintenance, EXAMPLE.rateKgPerWeek, EXAMPLE.sex);
  const projection = projectWeightLoss({ ...EXAMPLE, intake });
  const protein = proteinTarget(
    EXAMPLE.startWeightKg, EXAMPLE.goalWeightKg, EXAMPLE.heightCm, EXAMPLE.age,
  );

  const weeks = projection.weeksToGoal;
  const naive = projection.naiveWeeksToGoal;

  const rows = [
    { label: t('dailyCalories'), value: intake.toLocaleString(), unit: tc('calories'), lead: true },
    { label: t('maintenance'), value: Math.round(maintenance).toLocaleString(), unit: tc('calories') },
    { label: t('protein'), value: `${protein.low}-${protein.high}`, unit: tc('grams') },
    { label: t('fiber'), value: String(fiberTarget(intake)), unit: tc('grams') },
  ];

  // Sparkline of the real projection, sampled so the path stays small.
  const pts = projection.points;
  const step = Math.max(1, Math.floor(pts.length / 40));
  const sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  const minW = Math.min(...sampled.map((p) => p.weightKg));
  const maxW = Math.max(...sampled.map((p) => p.weightKg));
  const lastWeek = sampled[sampled.length - 1].week || 1;
  const path = sampled
    .map((p, i) => {
      const x = (p.week / lastWeek) * 260;
      const y = 66 - ((p.weightKg - minW) / (maxW - minW || 1)) * 56;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="panel p-6 sm:p-7">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-muted">
        {EXAMPLE.startWeightKg} {tc('kg')} to {EXAMPLE.goalWeightKg} {tc('kg')}, {EXAMPLE.age}, {EXAMPLE.heightCm} {tc('cm')}
      </p>

      <div className="mt-5">
        <svg viewBox="0 0 260 76" className="w-full h-auto" aria-hidden="true">
          <line x1="0" y1="66" x2="260" y2="66" stroke="rgba(246,246,243,0.18)" strokeWidth="1" />
          <path
            d={`${path} L 260 76 L 0 76 Z`}
            fill="rgba(11,211,191,0.12)"
            stroke="none"
          />
          <path d={path} fill="none" stroke="var(--color-brand-500)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {weeks && (
        <p className="mt-4 text-[0.9375rem]">
          <span className="t-num text-[1.75rem]" style={{ color: 'var(--color-brand-500)' }}>
            {weeks}
          </span>
          <span className="ml-2 text-muted">{tc('weeks')}</span>
          {naive && naive < weeks && (
            <span className="ml-3 text-[0.8125rem] text-muted">
              ({t('chartNaive').toLowerCase()}: {naive})
            </span>
          )}
        </p>
      )}

      <dl className="mt-6 space-y-3 border-t pt-5" style={{ borderColor: 'rgba(246,246,243,0.15)' }}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-[0.875rem] text-muted">{row.label}</dt>
            <dd className={`t-num ${row.lead ? 'text-[1.25rem]' : 'text-[1rem]'}`}>
              {row.value}
              <span className="ml-1.5 text-[0.75rem] font-medium text-muted">{row.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
