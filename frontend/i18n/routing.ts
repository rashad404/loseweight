import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'az', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = 'en' satisfies Locale;

export const localeNames: Record<Locale, string> = {
  en: 'English',
  az: 'Azərbaycanca',
  ru: 'Русский',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English is the default and lives at the root: loseweight.net/planner.
  // Other locales keep their prefix: loseweight.net/az/planner.
  localePrefix: 'as-needed',
});

/**
 * Public path for a route in a given locale. Use this for canonical URLs,
 * hreflang alternates and the sitemap, so English never emits a /en prefix.
 */
export function localePath(lang: string, path = ''): string {
  const suffix = path === '/' ? '' : path;
  if (lang === defaultLocale) return suffix || '/';
  return `/${lang}${suffix}`;
}
