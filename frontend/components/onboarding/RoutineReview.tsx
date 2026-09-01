'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import ItemRow from './ItemRow';
import type { MealSlot, RoutineItem, UserRoutine } from '@/lib/routine/models';
import { totalRoutine } from '@/lib/routine/models';
import { itemsNeedingAttention, resolveItem, uncertainItems } from '@/lib/routine/resolve';
import type { ParseSource } from '@/lib/ai/parse-client';

const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];

/**
 * The interpretation, shown before anything is calculated.
 *
 * The point of this screen is trust: a person should be able to see that we
 * read them correctly, and fix it in one click where we did not. So the summary
 * leads with what needs attention rather than with a total, and the total is
 * shown as a range with its own caveat rather than as a confident number.
 */
export default function RoutineReview({
  routine,
  source,
  locale,
  onChange,
  onContinue,
  onRestart,
}: {
  routine: UserRoutine;
  source: ParseSource;
  locale: string;
  onChange: (next: UserRoutine) => void;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations('onboarding');
  const [adding, setAdding] = useState<string | null>(null);
  const [newFood, setNewFood] = useState('');

  const attention = useMemo(() => itemsNeedingAttention(routine), [routine]);
  const uncertain = useMemo(() => uncertainItems(routine), [routine]);
  const totals = useMemo(() => totalRoutine(routine), [routine]);

  const updateItem = (mealId: string, next: RoutineItem) =>
    onChange({
      ...routine,
      meals: routine.meals.map((m) =>
        m.id === mealId ? { ...m, items: m.items.map((i) => (i.id === next.id ? next : i)) } : m),
    });

  const removeItem = (mealId: string, itemId: string) =>
    onChange({
      ...routine,
      meals: routine.meals
        .map((m) => (m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m))
        .filter((m) => m.items.length > 0),
    });

  const addItem = async (mealId: string) => {
    const name = newFood.trim();
    if (!name) return;
    const match = await resolveItem(name, null, locale);
    onChange({
      ...routine,
      meals: routine.meals.map((m) => m.id === mealId ? { ...m, items: [...m.items, {
        id: `item-${Date.now()}`,
        rawText: name,
        match,
        portion: { asDescribed: name, grams: null, household: null, confidence: 'low' },
        nonNegotiable: false,
      }] } : m),
    });
    setNewFood('');
    setAdding(null);
  };

  const ordered = [...routine.meals].sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  const sourceLabel =
    source === 'model' ? t('sourceModel') : source === 'cache' ? t('sourceCache') : t('sourceLocal');

  return (
    <div className="max-w-[760px]">
      <h1 className="t-h1 max-w-[18ch]">{t('reviewTitle')}</h1>
      <p className="t-lead mt-3 max-w-[56ch]">{t('reviewIntro')}</p>

      <p className="mt-2 text-[0.8125rem] text-muted">{sourceLabel}</p>

      {/* Leads with what needs fixing, because that is the only part that
          requires the person to do anything. */}
      <div
        className="mt-6 flex items-start gap-2.5 p-3.5 rounded-lg"
        style={{
          background: attention.length ? 'var(--sunken)' : 'var(--color-brand-50)',
          borderLeft: `3px solid ${attention.length ? 'var(--color-clay)' : 'var(--color-brand-500)'}`,
        }}
      >
        {attention.length ? (
          <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--color-clay)' }} />
        ) : (
          <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-800" />
        )}
        <div>
          <p className="text-[0.9375rem]">
            {attention.length ? t('needsAttention', { count: attention.length }) : t('allMatched')}
          </p>
          {uncertain.length > 0 && (
            <p className="mt-1 text-[0.8125rem] text-muted">
              {t('someUncertain', { count: uncertain.length })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-7 space-y-7">
        {ordered.map((meal) => (
          <section key={meal.id} aria-labelledby={`meal-${meal.id}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`meal-${meal.id}`} className="t-h3">
                {t(`slot.${meal.slot}` as 'slot.breakfast')}
              </h2>
              {meal.whenDescribed && (
                <span className="text-[0.8125rem] text-muted">{meal.whenDescribed}</span>
              )}
            </div>

            <ul className="mt-2">
              {meal.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  onChange={(next) => updateItem(meal.id, next)}
                  onRemove={() => removeItem(meal.id, item.id)}
                />
              ))}
            </ul>

            {adding === meal.id ? (
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus
                  className="field"
                  value={newFood}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('addItem')}
                  onChange={(e) => setNewFood(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void addItem(meal.id);
                    if (e.key === 'Escape') { setAdding(null); setNewFood(''); }
                  }}
                />
                <button type="button" className="btn btn-primary shrink-0" onClick={() => void addItem(meal.id)}>
                  {t('addItem')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(meal.id)}
                className="mt-2 inline-flex items-center gap-1.5 text-[0.875rem] text-muted hover:text-brand-800 transition-colors"
              >
                <Plus size={14} aria-hidden="true" />
                {t('addItem')}
              </button>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-line">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <span className="text-[0.9375rem] text-muted">{t('estimatedTotal')}</span>
          <span className="t-num text-[1.5rem]">
            {totals.nutrition.kcalLow.toLocaleString()} to {totals.nutrition.kcalHigh.toLocaleString()}
            <span className="ml-1.5 text-[0.8125rem] font-medium text-muted">kcal</span>
          </span>
        </div>
        <p className="mt-2 text-[0.8125rem] text-muted leading-relaxed max-w-[62ch]">
          {t('estimatedNote')}
        </p>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary btn-lg" onClick={onContinue}>
          {t('continue')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRestart}>
          {t('back')}
        </button>
      </div>
    </div>
  );
}
