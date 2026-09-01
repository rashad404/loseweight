'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import RoutineReview from './RoutineReview';
import { parseRoutine, type ParseSource } from '@/lib/ai/parse-client';
import { resolveRoutine } from '@/lib/routine/resolve';
import type { UserRoutine } from '@/lib/routine/models';

/**
 * Step one of onboarding: one free-text answer, then the interpretation.
 *
 * Consent is a real choice, not a checkbox to get past. Declining keeps the
 * text in the browser and uses the local parser, which is worse at messy prose
 * and says so, rather than blocking the person.
 */
export default function RoutineCapture({
  onConfirmed,
}: {
  onConfirmed: (routine: UserRoutine) => void;
}) {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const textId = useId();
  const consentId = useId();

  const [text, setText] = useState('');
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [source, setSource] = useState<ParseSource>('local');
  const [problem, setProblem] = useState<'none' | 'empty' | 'refused' | 'urgent'>('none');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) return;

    setBusy(true);
    setProblem('none');

    const parsed = await parseRoutine(text, { consent });

    if (parsed.source === 'refused') {
      setProblem(parsed.urgent ? 'urgent' : 'refused');
      setBusy(false);
      return;
    }

    if (parsed.routine.meals.length === 0) {
      setProblem('empty');
      setBusy(false);
      return;
    }

    const resolved = await resolveRoutine(parsed.routine, { locale });
    setRoutine(resolved);
    setSource(parsed.source);
    setBusy(false);
  };

  if (routine) {
    return (
      <RoutineReview
        routine={routine}
        source={source}
        locale={locale}
        onChange={setRoutine}
        onContinue={() => onConfirmed({ ...routine, confirmed: true, sourceText: text })}
        onRestart={() => { setRoutine(null); setText(''); }}
      />
    );
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="t-h1 max-w-[16ch]">{t('title')}</h1>
      <p className="t-lead mt-3 max-w-[58ch]">{t('intro')}</p>

      <form onSubmit={submit} className="mt-7">
        <label htmlFor={textId} className="field-label">{t('title')}</label>
        <textarea
          id={textId}
          className="field"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          style={{ resize: 'vertical', lineHeight: 1.6 }}
        />

        <fieldset className="mt-5 p-4 rounded-lg" style={{ background: 'var(--sunken)' }}>
          <legend className="sr-only">{t('consentTitle')}</legend>
          <p className="text-[0.9375rem] font-semibold">{t('consentTitle')}</p>
          <p className="mt-1.5 text-[0.8125rem] text-muted leading-relaxed">{t('consentBody')}</p>

          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2.5 text-[0.875rem] cursor-pointer">
              <input type="radio" name="consent" id={consentId} checked={consent}
                onChange={() => setConsent(true)} className="mt-1 accent-brand-600" />
              <span>{t('consentAccept')}</span>
            </label>
            <label className="flex items-start gap-2.5 text-[0.875rem] cursor-pointer">
              <input type="radio" name="consent" checked={!consent}
                onChange={() => setConsent(false)} className="mt-1 accent-brand-600" />
              <span>{t('consentDecline')}</span>
            </label>
          </div>
        </fieldset>

        {problem !== 'none' && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-[0.875rem]"
            style={{ color: 'var(--color-clay)' }}>
            <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              {problem === 'empty' ? t('nothingParsed')
                : problem === 'urgent' ? t('refusedUrgent')
                : t('refused')}
            </span>
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-lg mt-6"
          disabled={busy || text.trim().length < 10}>
          {busy ? t('reading') : t('submit')}
        </button>
      </form>
    </div>
  );
}
