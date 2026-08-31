'use client';

import { useTranslations } from 'next-intl';
import type { SavedPlan } from '@/lib/plan/storage';

/**
 * The concrete "what do I actually do on Monday" block. Without it the planner
 * hands over numbers and leaves the visitor to invent a protocol.
 */
export default function FirstWeeks({
  plan,
  weightUnit,
  toDisplayWeight,
}: {
  plan: SavedPlan;
  weightUnit: string;
  toDisplayWeight: (kg: number) => string;
}) {
  const t = useTranslations('planner');
  const tc = useTranslations('common');

  const reviewDate = new Date(`${plan.startedOn}T00:00:00`);
  reviewDate.setDate(reviewDate.getDate() + 21);

  // No step target: the planner never asks what you currently walk, so any
  // number here would be invented. Holding activity steady is also what makes
  // the calorie estimate checkable at the end of three weeks.
  const rows = [
    { label: t('fwCalories'), value: `${Math.round(plan.intake / 25) * 25 - 50} to ${Math.round(plan.intake / 25) * 25 + 50} ${tc('calories')}` },
    { label: t('fwProtein'), value: `${plan.proteinLow} to ${plan.proteinHigh} ${tc('grams')}` },
    { label: t('fwFiber'), value: `${plan.fiber} ${tc('grams')}` },
    { label: t('fwMovement'), value: t('fwMovementValue') },
  ];

  return (
    <section className="pt-6 border-t border-line">
      <h2 className="t-h3">{t('firstWeek')}</h2>
      <p className="mt-2 text-[0.9375rem] text-muted leading-relaxed max-w-[62ch]">
        {t('firstWeekIntro')}
      </p>

      <dl className="mt-5 divide-y" style={{ borderColor: 'var(--line)' }}>
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5">
            <dt className="text-[0.9375rem] text-muted">{row.label}</dt>
            <dd className="text-[0.9375rem] font-semibold text-right">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 notice text-[0.875rem] leading-relaxed">
        {t('fwDontChange', {
          date: reviewDate.toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
        })}
      </p>

      <p className="sr-only">
        Starting weight {toDisplayWeight(plan.startWeightKg)} {weightUnit}.
      </p>
    </section>
  );
}
