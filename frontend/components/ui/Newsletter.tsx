'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';

/**
 * Real subscription: the API stores the address and returns 201. What it cannot
 * do yet is send mail, so the success state says exactly that instead of asking
 * people to check an inbox for a message that will never arrive.
 */
export default function Newsletter({ source = 'site' }: { source?: string }) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error' | 'invalid'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState('invalid');
      return;
    }
    setState('sending');
    try {
      await apiClient.post('/subscribers', { email, locale, source });
      setState('done');
      setEmail('');
    } catch {
      setState('error');
    }
  };

  const errorId = `${id}-error`;
  const hasError = state === 'invalid' || state === 'error';

  return (
    <section className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-start border-t border-line pt-8">
      <div>
        <h2 className="t-h3">{t('title')}</h2>
        <p className="mt-2 text-[0.9375rem] text-muted max-w-[46ch] leading-relaxed">
          {t('body')}
        </p>
      </div>

      <div className="lg:justify-self-end w-full lg:max-w-md">
        {state === 'done' ? (
          <div role="status">
            <p className="font-semibold text-brand-800">{t('success')}</p>
            <p className="mt-1.5 text-[0.8125rem] text-muted">{t('noConfirm')}</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor={id} className="field-label">{t('label')}</label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id={id}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (hasError) setState('idle');
                }}
                placeholder={t('placeholder')}
                className="field"
                aria-describedby={hasError ? errorId : undefined}
                aria-invalid={hasError || undefined}
              />
              <button type="submit" className="btn btn-primary shrink-0" disabled={state === 'sending'}>
                {state === 'sending' ? t('sending') : t('submit')}
              </button>
            </div>

            {hasError && (
              <p id={errorId} role="alert" className="mt-2 text-sm font-medium" style={{ color: 'var(--color-clay)' }}>
                {state === 'invalid' ? t('invalid') : t('error')}
              </p>
            )}
          </form>
        )}

        <p className="mt-3 text-[0.75rem] text-muted leading-relaxed">{t('privacy')}</p>
      </div>
    </section>
  );
}
