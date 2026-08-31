'use client';

import { useTranslations } from 'next-intl';
import { paces, projectWeightLoss, type Sex } from '@/lib/health/calculations';

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
 * Three paces derived from this person's achievable deficit, not from fixed
 * rates. Fixed rates collapsed into each other once safety limits applied, so
 * two of the three cards showed identical numbers while still being presented
 * as a choice.
 *
 * A pace that levels off before the goal is still shown, because for a gentle
 * deficit that is the honest answer. It reports where it levels off and how
 * long it takes to reach a 10% loss, so the option stays informative instead of
 * reading as a dead end.
 */
export default function ScenarioCompare({
  input, selectedIntake, onSelect, weeksLabel, formatWeight,
}: {
  input: ScenarioInput;
  selectedIntake: number;
  onSelect: (intake: number, rateKgPerWeek: number) => void;
  weeksLabel: (weeks: number) => string;
  formatWeight: (kg: number) => string;
}) {
  const t = useTranslations('planner');
  const tc = useTranslations('common');

  const copy = {
    gentle: { label: t('scenarioGentle'), tradeoff: t('scenarioGentleTradeoff'), caution: null as string | null },
    standard: { label: t('scenarioStandard'), tradeoff: t('scenarioStandardTradeoff'), caution: null as string | null },
    faster: { label: t('scenarioFaster'), tradeoff: t('scenarioFasterTradeoff'), caution: t('scenarioNotFor') },
  };

  const scenarios = paces(input.maintenance, input.sex).map((pace) => {
    const projection = projectWeightLoss({ ...input, intake: pace.intake });

    // Where a goal is out of reach at this intake, a 10% loss is the milestone
    // clinical guidance actually cares about.
    const tenPercent = input.startWeightKg * 0.9;
    const tenPercentWeek = projection.points.find((p) => p.weightKg <= tenPercent)?.week ?? null;

    return {
      ...pace,
      ...copy[pace.id],
      weeks: projection.weeksToGoal,
      plateauKg: projection.plateauWeightKg,
      tenPercentWeek,
    };
  });

  return (
    <section className="pt-6 border-t border-line">
      <h2 className="t-h3">{t('scenarios')}</h2>
      <p className="mt-1.5 text-[0.8125rem] text-muted max-w-[68ch] leading-relaxed">
        {t('scenarioAllSafe')}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {scenarios.map((s) => {
          const active = s.intake === selectedIntake;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.intake, s.rateKgPerWeek)}
              aria-pressed={active}
              className="text-left rounded-xl p-4 transition-colors flex flex-col"
              style={{
                border: `1px solid ${active ? 'var(--color-brand-500)' : 'var(--line)'}`,
                borderWidth: active ? 2 : 1,
                background: active ? 'var(--color-brand-50)' : 'var(--raised)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{s.label}</span>
                <span className="text-[0.75rem] text-muted whitespace-nowrap">
                  {s.rateKgPerWeek.toFixed(2)} {tc('kg')}/{tc('weeks').slice(0, 4)}
                </span>
              </div>

              <div className="mt-3 t-num text-[1.5rem]">
                {s.intake.toLocaleString()}
                <span className="ml-1 text-[0.75rem] font-medium text-muted">{tc('calories')}</span>
              </div>

              {s.weeks ? (
                <div className="mt-1 text-[0.8125rem] text-muted">
                  {t('scenarioDuration')} {weeksLabel(s.weeks)}
                </div>
              ) : (
                <div className="mt-1 text-[0.8125rem]" style={{ color: 'var(--color-clay)' }}>
                  {t('scenarioReaches', { weight: formatWeight(s.plateauKg) })}
                  {s.tenPercentWeek !== null && (
                    <span className="block text-muted mt-0.5">
                      {t('scenarioMilestone', { weeks: s.tenPercentWeek })}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-3 text-[0.8125rem] leading-relaxed flex-1">{s.tradeoff}</p>

              {s.caution && (
                <p className="mt-2 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-clay)' }}>
                  {s.caution}
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
