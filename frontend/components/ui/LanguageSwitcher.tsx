'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t('language')}
        aria-expanded={open}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:sunken transition-colors text-sm font-medium"
      >
        <Globe size={18} />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 panel shadow-lg py-1 z-50">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setOpen(false);
                // Guides are per language, so switching locale lands on the
                // localized listing rather than a slug that may not exist.
                const isGuideDetail = /^\/guides\/.+/.test(pathname);
                router.replace(isGuideDetail ? '/guides' : pathname, { locale: code });
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:sunken transition-colors ${
                code === locale ? 'text-brand-800 font-semibold' : ''
              }`}
            >
              {localeNames[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
