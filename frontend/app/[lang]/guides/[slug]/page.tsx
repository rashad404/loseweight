import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';
import { absolute } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { fetchGuide, fetchGuides } from '@/lib/api/guides';
import { AlertTriangle } from 'lucide-react';
import Newsletter from '@/components/ui/Newsletter';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const guide = await fetchGuide(lang, slug);

  if (!guide) return { title: 'Not found' };

  return {
    title: guide.meta_title ?? guide.title,
    description: guide.meta_description ?? guide.excerpt ?? undefined,
    alternates: { canonical: localePath(lang, `/guides/${slug}`) },
    openGraph: {
      title: guide.title,
      description: guide.excerpt ?? undefined,
      type: 'article',
      publishedTime: guide.published_at ?? undefined,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const guide = await fetchGuide(lang, slug);
  if (!guide) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'guides' });
  const tn = await getTranslations({ locale: lang, namespace: 'nav' });

  const related = (await fetchGuides(lang, { perPage: 4 })).filter((g) => g.slug !== slug).slice(0, 3);

  const reviewed = Boolean(guide.review.reviewer_name);
  const publishedDate = guide.published_at
    ? new Date(guide.published_at).toLocaleDateString(lang, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  // Structured data so search engines can read the review trail rather than
  // guessing at authorship.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: guide.title,
    description: guide.meta_description ?? guide.excerpt,
    inLanguage: guide.language,
    datePublished: guide.published_at,
    author: { '@type': 'Organization', name: guide.review.author_name ?? 'LoseWeight.net' },
    ...(reviewed && {
      reviewedBy: {
        '@type': 'Person',
        name: guide.review.reviewer_name,
        jobTitle: guide.review.reviewer_credentials,
      },
      lastReviewed: guide.review.reviewed_at,
    }),
    citation: guide.sources.map((s) => s.title),
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        lang={lang}
        homeLabel={tn('home')}
        items={[
          { label: t('title'), href: '/guides' },
          ...(guide.category ? [{ label: guide.category.name, href: `/guides?category=${guide.category.slug}` }] : []),
          { label: guide.title },
        ]}
      />

      <article>
        <header>
          {guide.category && (
            <span className="text-xs font-semibold text-brand-800 uppercase tracking-wide">
              {guide.category.name}
            </span>
          )}
          <h1 className="mt-2 t-h1 leading-[1.15]">
            {guide.title}
          </h1>
          {guide.excerpt && (
            <p className="mt-4 text-lg text-muted leading-relaxed">{guide.excerpt}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {guide.review.author_name && <span>{t('writtenBy', { name: guide.review.author_name })}</span>}
            {publishedDate && <span>{t('published', { date: publishedDate })}</span>}
            <span>{t('readingTime', { minutes: guide.reading_minutes })}</span>
          </div>
        </header>

        {reviewed ? (
          <p className="mt-6 panel p-4 text-sm bg-brand-50 dark:bg-transparent">
            {t('reviewedBy', {
              name: guide.review.reviewer_name!,
              credentials: guide.review.reviewer_credentials ?? '',
              date: guide.review.reviewed_at
                ? new Date(guide.review.reviewed_at).toLocaleDateString(lang, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : '',
            })}
          </p>
        ) : (
          <div
            className="mt-6 panel p-4 flex gap-3 border-l-4"
            style={{ borderLeftColor: 'var(--color-clay)' }}
          >
            <AlertTriangle size={18} className="text-clay shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{t('notReviewed')}</p>
          </div>
        )}

        <div
          className="prose-guide mt-8"
          dangerouslySetInnerHTML={{ __html: guide.body }}
        />

        {guide.sources.length > 0 && (
          <section className="mt-12 pt-6 border-t border-line">
            <h2 className="t-h3">{t('sources')}</h2>
            <ol className="mt-4 space-y-2.5 list-decimal pl-5">
              {guide.sources.map((source, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-brand-800 hover:underline"
                    >
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="t-h3">{t('related')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {related.map((g) => (
              <Link
                key={g.id}
                href={`/guides/${g.slug}`}
                className="panel p-4 hover:border-brand-500 transition-colors group"
              >
                <h3 className="text-sm font-semibold leading-snug group-hover:text-brand-800">
                  {g.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14">
        <Newsletter source="guide" />
      </div>
    </div>
  );
}
