'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import RoutineCapture from './RoutineCapture';
import WeeklyPlanReview, { MissingPieces } from '../plan/WeeklyPlanReview';
import type { PlanChange, UserRoutine } from '@/lib/routine/models';
import {
  loadPlan, saveRoutine, saveWeekly, type SavedPlan,
} from '@/lib/plan/storage';
import { buildWeeklyPlan } from '@/lib/routine/weekly-plan';

type Stage = 'capture' | 'changes' | 'done';

/**
 * Holds the onboarding steps together: describe the routine, correct it, see
 * what would change, then start the week.
 *
 * The calorie plan has to exist first. The changes are chosen to close the gap
 * between what someone eats now and a target, so without a target there is
 * nothing to choose against, and inventing one here would quietly bypass the
 * planner's safety limits.
 */
export default function OnboardingFlow() {
  const t = useTranslations('weekly');
  const [stage, setStage] = useState<Stage>('capture');
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPlan(loadPlan());
      setChecked(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const confirmRoutine = (next: UserRoutine) => {
    setRoutine(next);
    saveRoutine(next);
    setStage('changes');
  };

  const accept = (changes: PlanChange[]) => {
    if (!routine || !plan) return;
    saveWeekly(buildWeeklyPlan(routine, plan, changes));
    setStage('done');
  };

  if (!checked) return null;

  if (stage === 'done') {
    return (
      <div className="panel p-6 max-w-prose">
        <h1 className="t-h3">{t('savedTitle')}</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">{t('savedBody')}</p>
        <Link href="/today" className="btn btn-primary mt-5">
          {t('goToday')}
        </Link>
      </div>
    );
  }

  if (stage === 'changes') {
    if (!plan) return <MissingPieces needsPlan />;
    if (!routine) return <MissingPieces needsPlan={false} />;

    return (
      <WeeklyPlanReview
        routine={routine}
        plan={plan}
        onAccept={accept}
        onBack={() => setStage('capture')}
      />
    );
  }

  return <RoutineCapture onConfirmed={confirmRoutine} />;
}
