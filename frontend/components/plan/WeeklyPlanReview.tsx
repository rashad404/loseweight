'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AlertCircle } from 'lucide-react';
import type { PlanChange, RoutineItem, UserRoutine } from '@/lib/routine/models';
import type { SavedPlan } from '@/lib/plan/storage';
import { expectedFrom, proposeChanges, toChange } from '@/lib/routine/weekly-plan';
import ChangeCard from './ChangeCard';

/**
 * The screen that has to answer, in one read:
 * what can I keep eating, what exactly changes, why those, what is it worth,
 * what else could I do instead, and can I actually fit this into my week.
 *
 * Every number on it comes from the deterministic rule library and the user's
 * own corrected routine. Rejecting a change recalculates the total immediately,
 * because a plan that keeps claiming the full saving after you drop a third of
 * it is lying about its own arithmetic.
 */
export default function WeeklyPlanReview({
  routine,
  plan,
  onAccept,
  onBack,
}: {
  routine: UserRoutine;
  plan: SavedPlan;
  onAccept: (changes: PlanChange[]) => void;
  onBack: () => void;
}) {
  const t = useTranslations('weekly');
  const tc = useTranslations();

  const proposal = useMemo(() => proposeChanges(routine, plan), [routine, plan]);
  const [changes, setChanges] = useState<PlanChange[]>(proposal.changes);

  const params = proposal.params;
  const items = useMemo(() => routine.meals.flatMap((m) => m.items), [routine]);

  const touched = new Set(changes.filter((c) => c.accepted).map((c) => c.targetItemId));
  const untouched = items.filter((i) => !touched.has(i.id)).length;

  const expected = expectedFrom(changes);
  const accepted = changes.filter((c) => c.accepted);

  /**
   * What this change looks like before and after, in the user's own foods.
   *
   * Built from the routine rather than written as prose per rule, so the
   * comparison can never describe something the routine does not contain.
   */
  const describe = (change: PlanChange): { original: string; modified: string } => {
    const item = items.find((i: RoutineItem) => i.id === change.targetItemId);
    const p = params[change.id] ?? {};

    if (item?.match?.nutrition) {
      const { kcalLow, kcalHigh } = item.match.nutrition;
      const low = Math.max(0, kcalLow - change.kcalSavedHigh);
      const high = Math.max(0, kcalHigh - change.kcalSavedLow);

      return {
        original: `${item.rawText}, ${kcalLow}-${kcalHigh} kcal`,
        modified: `${item.rawText}, ${low}-${high} kcal`,
      };
    }

    // Changes that add food rather than reduce it have nothing to subtract
    // from, so they say what arrives instead of pretending to a saving.
    if (change.proteinAddedG > 0) {
      return { original: '-', modified: `+${change.proteinAddedG} g protein` };
    }
    if (change.fiberAddedG > 0) {
      return { original: '-', modified: `+${change.fiberAddedG} g fiber` };
    }

    return { original: '-', modified: tc(change.title, p) };
  };

  const toggle = (id: string) =>
    setChanges((prev) => prev.map((c) => (c.id === id ? { ...c, accepted: !c.accepted } : c)));

  const replace = (rejectedId: string, replacementId: string) => {
    const candidate = proposal.replacements.find((r) => r.id === replacementId);
    if (!candidate) return;
    setChanges((prev) => prev.map((c) => (c.id === rejectedId ? toChange(candidate) : c)));
  };

  // Only offer a replacement from a rule not already in use, so swapping never
  // produces the same instruction twice against different foods.
  const usedRules = new Set(accepted.map((c) => c.ruleId));
  const replacements = proposal.replacements
    .filter((r) => !usedRules.has(r.ruleId))
    .slice(0, 3)
    .map((r) => ({ id: r.id, titleKey: r.titleKey, params: r.params }));

  return (
    <div>
      <h1 className="t-h1 max-w-[20ch]">{t('title')}</h1>
      <p className="t-lead mt-3 max-w-prose">{t('intro')}</p>

      <section className="mt-7 panel p-5">
        <h2 className="t-h4">{t('keepTitle')}</h2>
        <p className="mt-1 text-[0.9375rem] text-muted max-w-prose">
          {t('keepBody', { count: untouched })}
        </p>
      </section>

      <h2 className="t-h3 mt-9">{t('changeTitle')}</h2>
      <ul className="mt-4 space-y-4">
        {changes.map((change) => {
          const view = describe(change);
          return (
            <ChangeCard
              key={change.id}
              change={change}
              params={params[change.id] ?? {}}
              original={view.original}
              modified={view.modified}
              onToggle={() => toggle(change.id)}
              onReplace={(id) => replace(change.id, id)}
              replacements={replacements}
            />
          );
        })}
      </ul>

      <section className="mt-9 panel p-5">
        <h2 className="t-h4">{t('totalTitle')}</h2>

        {accepted.length === 0 ? (
          <p className="mt-2 text-[0.9375rem]" style={{ color: 'var(--color-clay)' }}>
            {t('noneAccepted')}
          </p>
        ) : expected.dailyHigh === 0 ? (
          // Printing "about 0 to 0 kcal a day" as a result would be absurd.
          // The honest reading is that a description of a day is a rough
          // instrument, not that this person has nothing to change.
          <>
            <p className="mt-2 text-[0.9375rem] font-medium">{t('noSaving')}</p>
            <p className="mt-2 text-[0.9375rem] text-muted max-w-prose">{t('noSavingWhy')}</p>
          </>
        ) : (
          <>
            <p className="t-num t-h2 mt-2">
              {t('totalDaily', { low: expected.dailyLow, high: expected.dailyHigh })}
            </p>
            <p className="mt-1 text-[0.9375rem]">
              {t('totalWeekly', {
                low: expected.weeklyLossLowKg.toFixed(2),
                high: expected.weeklyLossHighKg.toFixed(2),
              })}
            </p>
            <p className="mt-3 text-[0.8125rem] text-muted max-w-prose">{t('totalCaveat')}</p>
          </>
        )}

        {proposal.selection.shortOfTarget && accepted.length > 0 && (
          <p className="mt-3 text-[0.8125rem] flex items-start gap-1.5 max-w-prose">
            <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{t('shortOfTarget')}</span>
          </p>
        )}
      </section>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={accepted.length === 0}
          onClick={() => onAccept(changes)}
        >
          {t('accept')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          {t('back')}
        </button>
      </div>
    </div>
  );
}

/** Shown when the pieces this screen needs are not both present yet. */
export function MissingPieces({ needsPlan }: { needsPlan: boolean }) {
  const t = useTranslations('weekly');

  return (
    <div className="panel p-6 max-w-prose">
      <p className="text-[0.9375rem]">{needsPlan ? t('noPlan') : t('noRoutine')}</p>
      {needsPlan && (
        <Link href="/planner" className="btn btn-primary mt-4">
          {t('goPlanner')}
        </Link>
      )}
    </div>
  );
}
