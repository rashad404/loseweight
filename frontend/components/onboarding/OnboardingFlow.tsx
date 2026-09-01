'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import RoutineCapture from './RoutineCapture';
import type { UserRoutine } from '@/lib/routine/models';
import { ROUTINE_KEY } from '@/lib/plan/storage';

/**
 * Holds the onboarding steps together. Only routine capture exists so far; the
 * remaining questions and the first weekly plan attach here.
 */
export default function OnboardingFlow() {
  const [saved, setSaved] = useState(false);

  const confirm = (routine: UserRoutine) => {
    try {
      localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
    } catch {
      // Storage being unavailable must not lose the work; the next step still
      // receives the routine in memory.
    }
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="panel p-6 max-w-2xl">
        <p className="t-eyebrow">Routine saved</p>
        <h2 className="t-h2 mt-2">Your daily plan is ready</h2>
        <p className="t-lead mt-3">Start with three flexible actions. You can make any of them easier, replace it, move it, or skip it.</p>
        <Link href="/today" className="btn btn-primary mt-5">Open today</Link>
      </div>
    );
  }

  return <RoutineCapture onConfirmed={confirm} />;
}
