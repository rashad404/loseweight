import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { fetchGuideSitemap } from '@/lib/api/guides';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loseweight.net';

const STATIC_PATHS = [
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
  { path: '/about', priority: 0.4, changeFrequency: 'yearly' as const },
  { path: '/editorial-policy', priority: 0.4, changeFrequency: 'yearly' as const },
  { path: '/medical-disclaimer', priority: 0.4, changeFrequency: 'yearly' as const },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/contact', priority: 0.3, changeFrequency: 'yearly' as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const item of STATIC_PATHS) {
      entries.push({
        url: `${SITE}/${locale}${item.path}`,
        lastModified: new Date(),
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${SITE}/${l}${item.path}`]),
          ),
        },
      });
    }
  }

  // Guides exist in exactly one language, so each gets a single entry with no
  // hreflang alternates. Advertising alternates that 404 would be worse than none.
  for (const guide of await fetchGuideSitemap()) {
    entries.push({
      url: `${SITE}/${guide.language}/guides/${guide.slug}`,
      lastModified: new Date(guide.updated_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
