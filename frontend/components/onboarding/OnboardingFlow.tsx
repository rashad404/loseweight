'use client';

import { useState } from 'react';
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
      <p className="t-lead max-w-[52ch]">
        Routine saved. The first weekly plan is the next step to build.
      </p>
    );
  }

  return <RoutineCapture onConfirmed={confirm} />;
}
