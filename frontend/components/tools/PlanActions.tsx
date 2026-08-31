'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Check, Printer, Trash2 } from 'lucide-react';
import {
  PLAN_CHANGED, clearPlan, downloadFile, loadPlan, savePlan, type SavedPlan,
} from '@/lib/plan/storage';

/**
 * Save, update, reset, print and export for a plan. Everything is local: there
 * is no account, so the copy says so instead of implying sync.
 */
export default function PlanActions({ plan }: { plan: SavedPlan }) {
  const t = useTranslations('planner');
  const [existing, setExisting] = useState<SavedPlan | null>(null);
  const [state, setState] = useState<'idle' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const sync = () => setExisting(loadPlan());
    sync();
    window.addEventListener(PLAN_CHANGED, sync);
    return () => window.removeEventListener(PLAN_CHANGED, sync);
  }, []);

  const persist = () => {
    const ok = savePlan(plan);
    setState(ok ? 'saved' : 'failed');
    if (ok) setTimeout(() => setState('idle'), 2500);
  };

  return (
    <div className="pt-6 border-t border-line print:hidden">
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={persist} className="btn btn-primary">
          {state === 'saved' && <Check size={16} aria-hidden="true" />}
          {existing ? t('updatePlan') : t('savePlan')}
        </button>

        {existing && (
          <Link href="/tracker" className="btn btn-ghost">
            {t('goToTracker')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}

        <button type="button" onClick={() => window.print()} className="btn btn-ghost">
          <Printer size={16} aria-hidden="true" />
          {t('printPlan')}
        </button>

        <button
          type="button"
          onClick={() =>
            downloadFile(
              `loseweight-plan-${plan.startedOn}.json`,
              JSON.stringify(plan, null, 2),
              'application/json',
            )
          }
          className="btn btn-ghost"
        >
          {t('exportPlan')}
        </button>

        {existing && (
          <button
            type="button"
            onClick={clearPlan}
            className="btn btn-ghost"
            style={{ color: 'var(--color-clay)' }}
          >
            <Trash2 size={16} aria-hidden="true" />
            {t('resetPlan')}
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 text-[0.8125rem] text-muted">
        {state === 'saved' && <span className="text-brand-800 font-medium">{t('planSaved')}. </span>}
        {state === 'failed' && (
          <span style={{ color: 'var(--color-clay)' }} className="font-medium">
            {t('saveFailed')}{' '}
          </span>
        )}
        {t('savedNote')}
      </p>
    </div>
  );
}
