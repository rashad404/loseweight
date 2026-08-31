import { API_URL } from './client';

export interface GuideSummary {
  id: number;
  language: string;
  slug: string;
  title: string;
  excerpt: string | null;
  hero_image: string | null;
  reading_minutes: number;
  published_at: string | null;
  category?: { slug: string; name: string };
  review: {
    author_name: string | null;
    author_credentials: string | null;
    reviewer_name: string | null;
    reviewer_credentials: string | null;
    review_jurisdiction: string | null;
    /** Never rendered as true unless the owner has confirmed it. */
    us_licensed: boolean;
    /** False when author and reviewer are the same person. */
    independent_review: boolean;
    reviewed_at: string | null;
    last_substantive_update: string | null;
  };
}

export interface Guide extends GuideSummary {
  body: string;
  sources: { title: string; url?: string }[];
  meta_title: string | null;
  meta_description: string | null;
}

export interface GuideCategory {
  slug: string;
  name: string;
  description: string | null;
  guides_count: number;
}

/**
 * Server-side fetches. Guides are filtered by language in the API and never
 * fall back to another locale, so an `az` guide simply does not exist for an
 * `en` reader.
 */
async function get<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchGuides(
  lang: string,
  params: { category?: string; perPage?: number } = {},
): Promise<GuideSummary[]> {
  const query = new URLSearchParams({ lang, per_page: String(params.perPage ?? 24) });
  if (params.category) query.set('category', params.category);

  const json = await get<{ data: GuideSummary[] }>(`/guides?${query}`);
  return json?.data ?? [];
}

export async function fetchGuide(lang: string, slug: string): Promise<Guide | null> {
  const json = await get<{ data: Guide }>(`/guides/${slug}?lang=${lang}`);
  return json?.data ?? null;
}

export async function fetchCategories(lang: string): Promise<GuideCategory[]> {
  const json = await get<{ data: GuideCategory[] }>(`/guides/categories?lang=${lang}`);
  return json?.data ?? [];
}

export async function fetchGuideSitemap(): Promise<
  { language: string; slug: string; updated_at: string }[]
> {
  const json = await get<{ data: { language: string; slug: string; updated_at: string }[] }>(
    '/guides/sitemap',
    3600,
  );
  return json?.data ?? [];
}
