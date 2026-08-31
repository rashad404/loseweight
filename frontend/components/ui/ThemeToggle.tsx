'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemeToggle() {
  const t = useTranslations('nav');
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Light is the default. Only an explicit stored choice turns on dark, so
    // this must match the inline script in the layout or the two disagree on
    // first paint.
    const isDark = localStorage.getItem('lw_theme') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('lw_theme', next ? 'dark' : 'light');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('theme')}
      className="p-2 rounded-lg hover:sunken transition-colors"
    >
      {mounted && dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
