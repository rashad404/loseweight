import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'az', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  az: 'Azərbaycanca',
  ru: 'Русский',
};

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});
