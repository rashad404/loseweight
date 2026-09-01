'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, RotateCcw, X } from 'lucide-react';
import type { PlanChange } from '@/lib/routine/models';

/**
 * One proposed change, with everything needed to judge it.
 *
 * The original and the modified sit side by side because the question a reader
 * actually has is "what does this cost me", and that is only answerable by
 * seeing both. The reason comes from the rule that chose it, so the explanation
 * cannot drift from the decision.
 *
 * Rejecting is a first-class action, not a hidden one. A plan you cannot argue
 * with is a plan you abandon silently instead.
 */
export default function ChangeCard({
  change,
  params,
  original,
  modified,
  onToggle,
  onReplace,
  replacements,
}: {
  change: PlanChange;
  params: Record<string, string | number>;
  original: string;
  modified: string;
  onToggle: () => void;
  onReplace?: (id: string) => void;
  replacements?: { id: string; titleKey: string; params: Record<string, string | number> }[];
}) {
  const t = useTranslations('weekly');
  const tc = useTranslations();
  const [showAlternatives, setShowAlternatives] = useState(false);

  const saves = change.kcalSavedHigh > 0;

  return (
    <li
      className="panel p-5"
      style={change.accepted ? undefined : { opacity: 0.55 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="t-h4">{tc(change.title, params)}</h3>
          <p className="mt-1 text-[0.8125rem] text-muted">
            {saves
              ? t('worth', { low: change.kcalSavedLow, high: change.kcalSavedHigh })
              : t('worthNothing')}
            {' · '}
            {t(`difficulty.${change.difficulty}`)}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="btn btn-ghost btn-sm shrink-0"
          aria-pressed={!change.accepted}
        >
          {change.accepted
            ? <><X size={14} aria-hidden="true" />{t('reject')}</>
            : <><RotateCcw size={14} aria-hidden="true" />{t('restore')}</>}
        </button>
      </div>

      {/* The comparison. Stacked on a phone, side by side once there is room. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="p-3 rounded-lg" style={{ background: 'var(--sunken)' }}>
          <p className="field-label">{t('originalCol')}</p>
          <p className="mt-0.5 text-[0.9375rem]">{original}</p>
        </div>

        <ArrowRight
          size={16}
          aria-hidden="true"
          className="hidden sm:block text-muted mx-auto"
        />

        <div
          className="p-3 rounded-lg"
          style={{ background: 'var(--color-brand-50)', color: 'var(--color-brand-900, inherit)' }}
        >
          <p className="field-label">{t('modifiedCol')}</p>
          <p className="mt-0.5 text-[0.9375rem]">{modified}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="field-label">{t('whyThis')}</p>
        <p className="mt-1 text-[0.9375rem] text-muted max-w-prose">
          {tc(change.rationale, params)}
        </p>
      </div>

      {change.alternatives.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAlternatives(!showAlternatives)}
            aria-expanded={showAlternatives}
            className="text-[0.8125rem] text-muted hover:underline"
          >
            {t('otherWays')}
          </button>

          {showAlternatives && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {change.alternatives.map((key) => (
                <li
                  key={key}
                  className="text-[0.8125rem] px-2.5 py-1.5 rounded-lg border border-line"
                >
                  {tc(key)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Replacing offers another change the rule library already costed,
          never a free-text suggestion nobody put a number to. */}
      {!change.accepted && replacements && replacements.length > 0 && onReplace && (
        <div className="mt-3">
          <p className="field-label">{t('replaceWith')}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {replacements.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onReplace(r.id)}
                  className="text-left text-[0.8125rem] px-2.5 py-1.5 rounded-lg border border-line hover:sunken"
                >
                  {tc(r.titleKey, r.params)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
