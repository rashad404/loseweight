'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';

export default function Newsletter({ source = 'site' }: { source?: string }) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
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

  return (
    <section className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center border-t-2 border-line pt-10">
      <div>
        <h2 className="t-h2 max-w-[18ch]">{t('title')}</h2>
        <p className="mt-3 text-[0.9375rem] text-muted max-w-[46ch] leading-relaxed">
          {t('body')}
        </p>
      </div>

      <div className="lg:justify-self-end w-full lg:max-w-md">
        {state === 'done' ? (
          <p className="font-semibold text-brand-600">{t('success')}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === 'invalid') setState('idle');
              }}
              placeholder={t('placeholder')}
              className="field"
              aria-label={t('placeholder')}
            />
            <button type="submit" className="btn btn-primary shrink-0" disabled={state === 'sending'}>
              {t('submit')}
            </button>
          </form>
        )}

        {state === 'invalid' && <p className="mt-2 text-sm" style={{ color: 'var(--color-clay)' }}>{t('invalid')}</p>}
        {state === 'error' && <p className="mt-2 text-sm" style={{ color: 'var(--color-clay)' }}>{t('error')}</p>}
      </div>
    </section>
  );
}
