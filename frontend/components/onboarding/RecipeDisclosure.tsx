'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import type { ResolvedRecipe } from '@/lib/routine/models';
import { confirmRecipe } from '@/lib/api/recipes';

/**
 * Shows what a dish was assumed to contain.
 *
 * A dish like plov has no single database entry, so its figure is built from a
 * proposed composition. "Plov" is also not one recipe: the rice, the meat, the
 * cooking fat and the serving all vary by household, and gram weights are the
 * least reliable thing a model produces. So a proposal is labelled as one, its
 * assumptions are printed in full, and the user is asked rather than told.
 *
 * A composition a reviewer has approved says so instead, and asks nothing.
 */
export default function RecipeDisclosure({
  recipe,
  onConfirmed,
}: {
  recipe: ResolvedRecipe;
  onConfirmed?: () => void;
}) {
  const t = useTranslations('onboarding');
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(
    recipe.state === 'user_confirmed' || recipe.state === 'reviewed' || recipe.state === 'curated_override',
  );

  const approved = recipe.state === 'reviewed' || recipe.state === 'curated_override';
  const label = approved
    ? t('recipeReviewed')
    : recipe.state === 'user_confirmed'
      ? t('recipeYours')
      : t('recipeProposed');

  const accept = async () => {
    setConfirmed(true);
    if (recipe.id !== null) await confirmRecipe(recipe.id);
    onConfirmed?.();
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 text-[0.75rem] text-muted hover:underline"
      >
        <ChevronDown
          size={13}
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 120ms' }}
        />
        {label}
      </button>

      {open && (
        <div id={panelId} className="mt-2 p-3 rounded-lg text-[0.8125rem]" style={{ background: 'var(--sunken)' }}>
          {!approved && <p className="text-muted">{t('recipeIntro')}</p>}

          <ul className="mt-2 space-y-1">
            {recipe.ingredients.map((ing) => (
              <li key={ing.food} className="flex justify-between gap-3">
                <span className={ing.matched ? undefined : 'text-muted'}>
                  {ing.matched ?? ing.food}
                </span>
                <span className="t-num text-muted shrink-0">
                  {ing.gramsLow === ing.gramsHigh
                    ? `${ing.gramsLow} g`
                    : `${ing.gramsLow}-${ing.gramsHigh} g`}
                </span>
              </li>
            ))}
          </ul>

          {recipe.missing.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5" style={{ color: 'var(--color-clay)' }}>
              <AlertCircle size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{t('recipeMissing', { items: recipe.missing.join(', ') })}</span>
            </p>
          )}

          {recipe.assumptions.map((line) => (
            <p key={line} className="mt-2 text-muted">{line}</p>
          ))}

          {!approved && (
            <div className="mt-3">
              {confirmed ? (
                <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-brand-800 font-medium">
                  <Check size={13} aria-hidden="true" />
                  {t('recipeConfirmed')}
                </span>
              ) : (
                <button type="button" onClick={() => void accept()} className="btn btn-ghost btn-sm">
                  {t('recipeConfirm')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
