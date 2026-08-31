import type { ReactNode } from 'react';
import { defaultLocale } from '@/i18n/routing';

export type PolicySlug =
  | 'about' | 'editorial-policy' | 'medical-disclaimer'
  | 'privacy' | 'terms' | 'corrections';

export interface PolicyContent {
  title: string;
  description: string;
  body: ReactNode;
}

/**
 * Policy prose per locale.
 *
 * Serving English text under an `az` URL is duplicate content on exactly the
 * pages where trustworthiness is judged, so each locale gets its own writing
 * rather than a translation. `hasPolicy` drives both the noindex decision and
 * the hreflang cluster, so a locale is only advertised once it genuinely exists.
 */
export const POLICY_LOCALES: Record<PolicySlug, string[]> = {
  about: ['en', 'az', 'ru'],
  'editorial-policy': ['en', 'az', 'ru'],
  'medical-disclaimer': ['en', 'az', 'ru'],
  privacy: ['en', 'az', 'ru'],
  terms: ['en', 'az', 'ru'],
  corrections: ['en', 'az', 'ru'],
};

export const hasPolicy = (slug: PolicySlug, lang: string) =>
  POLICY_LOCALES[slug].includes(lang);

export const policyLocale = (slug: PolicySlug, lang: string) =>
  hasPolicy(slug, lang) ? lang : defaultLocale;
