import type { MetadataRoute } from 'next';
import { locales, localePath } from '@/i18n/routing';
import { fetchGuideSitemap } from '@/lib/api/guides';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loseweight.net';

/**
 * Pages that genuinely exist in every locale. These get one entry per language
 * with reciprocal hreflang.
 */
const LOCALIZED_PATHS = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/planner', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/tracker', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/calculators', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/calculators/tdee', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/calculators/bmi', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/calculators/waist-to-height', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/calculators/protein', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/calculators/plateau', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/guides', priority: 0.9, changeFrequency: 'weekly' as const },
];

/**
 * Policy and trust pages. Their bodies are written in English only, so only the
 * English URL is listed. The other locales render the same English text and are
 * marked noindex, and a noindex URL has no business in a sitemap.
 */
const ENGLISH_ONLY_PATHS = [
  { path: '/about', priority: 0.4 },
  { path: '/editorial-policy', priority: 0.4 },
  { path: '/medical-disclaimer', priority: 0.4 },
  { path: '/corrections', priority: 0.3 },
  { path: '/privacy', priority: 0.3 },
  { path: '/terms', priority: 0.3 },
  { path: '/contact', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const item of LOCALIZED_PATHS) {
      entries.push({
        url: `${SITE}${localePath(locale, item.path)}`,
        lastModified: new Date(),
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${SITE}${localePath(l, item.path)}`]),
          ),
        },
      });
    }
  }

  for (const item of ENGLISH_ONLY_PATHS) {
    entries.push({
      url: `${SITE}${localePath('en', item.path)}`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: item.priority,
    });
  }

  // Guides exist in exactly one language, so each gets a single entry with no
  // hreflang alternates. Advertising alternates that 404 would be worse than none.
  for (const guide of await fetchGuideSitemap()) {
    entries.push({
      url: `${SITE}${localePath(guide.language, `/guides/${guide.slug}`)}`,
      lastModified: new Date(guide.updated_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
