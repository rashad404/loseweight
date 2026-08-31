import type { Metadata } from 'next';
import { defaultLocale, locales, localePath } from '@/i18n/routing';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loseweight.net').replace(/\/$/, '');

export const absolute = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`;

/**
 * Canonical plus reciprocal hreflang for a page that genuinely exists in every
 * locale. `x-default` points at the default locale, which is what a crawler
 * should fall back to when no language matches.
 */
export function alternatesFor(lang: string, path = ''): Metadata['alternates'] {
  return {
    canonical: absolute(localePath(lang, path)),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, absolute(localePath(l, path))])),
      'x-default': absolute(localePath(defaultLocale, path)),
    },
  };
}

/**
 * Metadata for the policy and trust pages.
 *
 * Their bodies are written in English only. Serving that English text under an
 * `az` or `ru` URL would be duplicate content on exactly the pages where
 * trustworthiness is judged, so the non-English versions stay reachable for
 * anyone who navigates to them but are kept out of the index, out of the
 * sitemap, and out of the hreflang cluster. Once a page is genuinely translated,
 * add its locale to `translated` and it rejoins all three.
 */
export function policyMetadata({
  lang,
  path,
  title,
  description,
  translated = [defaultLocale],
}: {
  lang: string;
  path: string;
  title: string;
  description: string;
  translated?: string[];
}): Metadata {
  const isTranslated = translated.includes(lang);

  return {
    title,
    description,
    alternates: {
      canonical: absolute(localePath(lang, path)),
      languages: {
        ...Object.fromEntries(
          translated.map((l) => [l, absolute(localePath(l, path))]),
        ),
        'x-default': absolute(localePath(defaultLocale, path)),
      },
    },
    robots: isTranslated
      ? undefined
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
  };
}
