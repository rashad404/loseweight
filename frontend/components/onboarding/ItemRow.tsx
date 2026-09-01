'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Check, Heart, Pencil, X } from 'lucide-react';
import type { RoutineItem } from '@/lib/routine/models';
import { resolveItem } from '@/lib/routine/resolve';

/**
 * One food, with everything the user needs to judge and fix it.
 *
 * The user's own words stay visible: they are the only thing we know for
 * certain, and hiding them behind a matched name makes a wrong match invisible.
 * A row that resolved confidently stays quiet. A row that did not is the one
 * that gets the space and the colour.
 */
export default function ItemRow({
  item,
  onChange,
  onRemove,
  locale,
}: {
  item: RoutineItem;
  onChange: (next: RoutineItem) => void;
  onRemove: () => void;
  locale: string;
}) {
  const t = useTranslations('onboarding');
  const nameId = useId();
  const portionId = useId();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.rawText);
  const [grams, setGrams] = useState(item.portion.grams?.toString() ?? '');
  const [busy, setBusy] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) firstField.current?.select(); }, [editing]);

  const unmatched = !item.match?.nutrition;
  const uncertain = item.match?.confidence === 'low';
  const mixed = item.match?.caveat === 'mixedDish';
  const assumed = item.match?.caveat === 'assumedPortion';

  // Several foods answered the word and none clearly won, so the user picks
  // rather than us guessing. Until then the item carries no nutrition.
  const choices = item.match?.caveat === 'needsChoice' ? item.match.alternatives ?? [] : [];

  const apply = async () => {
    setBusy(true);
    const g = grams.trim() ? Number.parseFloat(grams) : null;
    const match = await resolveItem(name.trim() || item.rawText, Number.isFinite(g as number) ? g : null, locale);
    onChange({
      ...item,
      rawText: name.trim() || item.rawText,
      match,
      portion: {
        ...item.portion,
        grams: Number.isFinite(g as number) ? (g as number) : null,
        confidence: Number.isFinite(g as number) ? 'high' : item.portion.confidence,
      },
    });
    setBusy(false);
    setEditing(false);
  };

  const choose = (picked: NonNullable<RoutineItem['match']>) =>
    onChange({ ...item, match: picked });

  const kcal = item.match?.nutrition
    ? item.match.nutrition.kcalLow === item.match.nutrition.kcalHigh
      ? `${item.match.nutrition.kcalLow}`
      : `${item.match.nutrition.kcalLow}-${item.match.nutrition.kcalHigh}`
    : null;

  if (editing) {
    return (
      <li className="py-3 px-3 rounded-lg" style={{ background: 'var(--sunken)' }}>
        <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end">
          <div>
            <label htmlFor={nameId} className="field-label">{t('searchPlaceholder')}</label>
            <input ref={firstField} id={nameId} className="field" value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void apply(); if (e.key === 'Escape') setEditing(false); }} />
          </div>
          <div>
            <label htmlFor={portionId} className="field-label">{t('portion')} (g)</label>
            <input id={portionId} className="field" inputMode="decimal" value={grams}
              placeholder={item.portion.household ?? ''}
              onChange={(e) => setGrams(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void apply(); if (e.key === 'Escape') setEditing(false); }} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void apply()} disabled={busy}>
              {busy ? t('searching') : <Check size={16} aria-hidden="true" />}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className="py-2.5 flex items-start justify-between gap-3 border-t border-line first:border-t-0"
      style={unmatched ? { borderLeft: '2px solid var(--color-clay)', paddingLeft: '0.75rem' } : undefined}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{item.rawText}</span>
          {item.nonNegotiable && (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-brand-50)', color: 'var(--color-brand-800)' }}>
              <Heart size={10} aria-hidden="true" />
              {t('nonNegotiable')}
            </span>
          )}
        </div>

        {choices.length > 0 ? (
          <div className="mt-1">
            <p className="text-[0.8125rem] flex items-start gap-1.5" style={{ color: 'var(--color-clay)' }}>
              <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{t('chooseMatch')}. {t('chooseMatchHelp')}</span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {choices.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => choose(c)}
                    className="text-left text-[0.8125rem] px-2.5 py-1.5 rounded-lg border border-line hover:sunken"
                  >
                    {c.name}
                    {c.nutrition && (
                      <span className="t-num text-muted"> · {c.nutrition.kcalLow}-{c.nutrition.kcalHigh} kcal</span>
                    )}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-[0.8125rem] px-2.5 py-1.5 rounded-lg border border-line text-muted hover:sunken"
                >
                  {t('chooseNone')}
                </button>
              </li>
            </ul>
          </div>
        ) : unmatched ? (
          <p className="mt-1 text-[0.8125rem] flex items-start gap-1.5" style={{ color: 'var(--color-clay)' }}>
            <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{t('noMatch')}. {t('noMatchHelp')}</span>
          </p>
        ) : (
          <p className="mt-0.5 text-[0.8125rem] text-muted">
            {t('matchedTo')} {item.match!.name}
            {kcal && <span className="t-num"> · {kcal} kcal</span>}
            {item.portion.household && <span> · {item.portion.household}</span>}
          </p>
        )}

        {(mixed || assumed || uncertain) && !unmatched && choices.length === 0 && (
          <p className="mt-1 text-[0.75rem] text-muted">
            {/* Saying "portion not stated" to someone who wrote "two slices"
                reads as if we ignored them. They said it; we converted it. */}
            {mixed ? t('mixedDish') : item.portion.household ? t('portionFromWords') : t('portionUnknown')}
          </p>
        )}
      </div>

      <div className="flex gap-1 shrink-0">
        <button type="button" onClick={() => onChange({ ...item, nonNegotiable: !item.nonNegotiable })}
          aria-label={item.nonNegotiable ? t('unmarkNonNegotiable') : t('markNonNegotiable')}
          aria-pressed={item.nonNegotiable}
          className="p-1.5 rounded-lg hover:sunken"
          style={{ color: item.nonNegotiable ? 'var(--color-brand-700)' : 'var(--text-muted)' }}>
          <Heart size={15} aria-hidden="true" fill={item.nonNegotiable ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={() => setEditing(true)} aria-label={`${t('editItem')} ${item.rawText}`}
          className="p-1.5 rounded-lg hover:sunken text-muted">
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button type="button" onClick={onRemove} aria-label={`${t('removeItem')} ${item.rawText}`}
          className="p-1.5 rounded-lg hover:sunken text-muted">
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
