'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { WeeklyPlan } from '@/lib/routine/models';
import {
  ENTRIES_CHANGED, WEEKLY_CHANGED, loadDays, loadEntries, loadWeekly,
} from '@/lib/plan/storage';
import { measuredGapKcal, reviewPlan, type Review } from '@/lib/routine/review';
import { SAFETY_LIMITS } from '@/lib/safety/boundaries';

/**
 * What the weigh-ins say about the plan, and what to do about it.
 *
 * The verdict and the action come from `review.ts`, which is deterministic and
 * tested. This renders it and nothing more. In particular it does not soften a
 * "see a clinician" into encouragement, and it does not congratulate faster
 * than planned loss, because both would be telling someone what they want to
 * hear about their own health.
 */
export default function PlanReview() {
  const t = useTranslations('review');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const weekly = loadWeekly();
      setPlan(weekly);
      setReview(weekly ? reviewPlan(weekly, loadEntries(), loadDays()) : null);
      setReady(true);
    };

    sync();
    window.addEventListener(ENTRIES_CHANGED, sync);
    window.addEventListener(WEEKLY_CHANGED, sync);
    return () => {
      window.removeEventListener(ENTRIES_CHANGED, sync);
      window.removeEventListener(WEEKLY_CHANGED, sync);
    };
  }, []);

  if (!ready) return null;

  if (!plan || !review) {
    return (
      <section className="panel p-5">
        <h2 className="t-h4">{t('title')}</h2>
        <p className="mt-2 text-[0.9375rem] text-muted">{t('noPlan')}</p>
        <Link href="/onboarding" className="btn btn-ghost btn-sm mt-3">
          {t('action.wait')}
        </Link>
      </section>
    );
  }

  const kg = (n: number | null) => (n === null ? '?' : Math.abs(n).toFixed(2));

  const explanation = t(review.explanationKey.replace('review.', ''), {
    days: review.days,
    min: SAFETY_LIMITS.minDaysBeforeAdjusting,
    weighIns: review.weighIns,
    percent: Math.round((review.adherence ?? 0) * 100),
    actual: kg(review.actualKgPerWeek),
    expected: kg(review.expectedKgPerWeek),
    gap: Math.abs(measuredGapKcal(review) ?? 0),
  });

  // Colour carries meaning here, so it never carries it alone: the icon and
  // the wording say the same thing for anyone who cannot see the difference.
  const tone = review.action === 'see-a-clinician' || review.action === 'ease-off'
    ? { color: 'var(--color-clay)', Icon: AlertCircle }
    : review.action === 'wait'
      ? { color: 'var(--text-muted)', Icon: Clock }
      : { color: 'var(--color-brand-800)', Icon: CheckCircle2 };

  return (
    <section className="panel p-5">
      <h2 className="t-h4">{t('title')}</h2>

      <p className="mt-2 flex items-start gap-2 font-medium" style={{ color: tone.color }}>
        <tone.Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        {t(`action.${review.action}`)}
      </p>

      <p className="mt-2 text-[0.9375rem] text-muted max-w-prose">{explanation}</p>
    </section>
  );
}
