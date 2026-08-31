'use client';

import { useTranslations } from 'next-intl';
import {
  CALORIE_FLOOR, intakeForRate, projectWeightLoss, type Sex,
} from '@/lib/health/calculations';

export interface ScenarioInput {
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  activityFactor: number;
  maintenance: number;
}

/**
 * Three paces side by side, with the tradeoff spelled out. Showing only the
 * chosen rate hides the fact that a faster plan costs adherence and lean mass,
 * which is the decision the visitor is actually making.
 */
export default function ScenarioCompare({
  input,
  selectedRate,
  onSelect,
  weeksLabel,
}: {
  input: ScenarioInput;
  selectedRate: number;
  onSelect: (rate: number) => void;
  weeksLabel: (weeks: number) => string;
}) {
  const t = useTranslations('planner');
  const tc = useTranslations('common');

  const scenarios = [
    { id: 'Gentle', rate: 0.3, label: t('scenarioGentle'), tradeoff: t('scenarioGentleTradeoff'), caution: null },
    { id: 'Standard', rate: 0.55, label: t('scenarioStandard'), tradeoff: t('scenarioStandardTradeoff'), caution: null },
    { id: 'Faster', rate: 0.85, label: t('scenarioFaster'), tradeoff: t('scenarioFasterTradeoff'), caution: t('scenarioNotFor') },
  ].map((s) => {
    const { intake, clamped } = intakeForRate(input.maintenance, s.rate, input.sex);
    const projection = projectWeightLoss({ ...input, intake });
    return { ...s, intake, clamped, weeks: projection.weeksToGoal, reached: projection.goalReached };
  });

  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="t-h3">{t('scenarios')}</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((s) => {
          const active = Math.abs(s.rate - selectedRate) < 0.08;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.rate)}
              aria-pressed={active}
              className="text-left rounded-xl p-4 transition-colors"
              style={{
                border: `1px solid ${active ? 'var(--color-brand-500)' : 'var(--line)'}`,
                borderWidth: active ? 2 : 1,
                background: active ? 'var(--color-brand-50)' : 'var(--raised)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{s.label}</span>
                <span className="text-[0.75rem] text-muted">
                  {s.rate.toFixed(2)} {tc('kg')}/{tc('weeks').slice(0, 4)}
                </span>
              </div>

              <div className="mt-3 t-num text-[1.5rem]">
                {s.intake.toLocaleString()}
                <span className="ml-1 text-[0.75rem] font-medium text-muted">{tc('calories')}</span>
              </div>

              <div className="mt-1 text-[0.8125rem] text-muted">
                {s.weeks ? `${t('scenarioDuration')} ${weeksLabel(s.weeks)}` : t('notReached')}
              </div>

              <p className="mt-3 text-[0.8125rem] leading-relaxed">{s.tradeoff}</p>

              {s.caution && (
                <p className="mt-2 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-clay)' }}>
                  {s.caution}
                </p>
              )}

              {s.clamped === 'floor' && (
                <p className="mt-2 text-[0.75rem] text-muted">
                  {t('clampedFloor', { floor: CALORIE_FLOOR[input.sex] })}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[0.8125rem] text-muted">{t('rangeNote')}</p>
    </section>
  );
}
