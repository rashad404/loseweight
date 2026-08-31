'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Deliberately stateless. The inline script in the layout has already set the
 * `dark` class before first paint, so the DOM is the source of truth. Holding
 * the theme in React state instead would mean reading localStorage in an effect,
 * which renders the wrong icon for one frame and triggers a cascading render.
 *
 * Both icons are rendered and swapped with CSS, so the correct one is present
 * in the server-rendered HTML and there is nothing to hydrate.
 */
export default function ThemeToggle() {
  const t = useTranslations('nav');

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    root.classList.toggle('dark', next);
    try {
      localStorage.setItem('lw_theme', next ? 'dark' : 'light');
    } catch {
      // Private mode or blocked storage: the toggle still works for this page view.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('theme')}
      className="p-2 rounded-lg hover:sunken transition-colors"
    >
      <Moon size={18} className="block dark:hidden" aria-hidden="true" />
      <Sun size={18} className="hidden dark:block" aria-hidden="true" />
    </button>
  );
}
