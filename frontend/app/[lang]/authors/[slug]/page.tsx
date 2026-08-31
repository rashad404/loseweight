import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { AUTHORS, authorBySlug } from '@/lib/authors';
import { fetchGuides } from '@/lib/api/guides';
import { absolute, alternatesFor } from '@/lib/seo';
import { localePath, locales } from '@/i18n/routing';

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    Object.keys(AUTHORS).map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const author = authorBySlug(slug);
  if (!author) return { title: 'Not found' };

  const bio = author.bio[lang] ?? author.bio.en;

  return {
    title: `${author.name}, ${author.credentials}`,
    description: bio.slice(0, 280),
    alternates: alternatesFor(lang, `/authors/${slug}`),
  };
}

export default async function AuthorPage({
  params,
}: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const author = authorBySlug(slug);
  if (!author) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'authors' });
  const tn = await getTranslations({ locale: lang, namespace: 'nav' });
  const tg = await getTranslations({ locale: lang, namespace: 'guides' });

  const articles = await fetchGuides(lang, { author: author.name, perPage: 50 });
  const pick = (m: Record<string, string>) => m[lang] ?? m.en;

  // Person schema carrying only verified facts. No jobTitle implying US
  // practice, no affiliation, no award, no credential we cannot evidence.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absolute(localePath(lang, `/authors/${slug}`)) + '#person',
    name: author.name,
    description: pick(author.bio),
    jobTitle: pick(author.role),
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Azerbaijan Medical University' },
    knowsAbout: ['Weight management', 'Nutrition', 'Pediatrics'],
    url: absolute(localePath(lang, `/authors/${slug}`)),
  };

  const facts = [
    { label: t('role'), value: pick(author.role) },
    { label: t('education'), value: author.credentials },
    { label: t('background'), value: t('pediatrics') },
    { label: t('location'), value: t('usa') },
  ];

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-12 sm:py-16">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs lang={lang} homeLabel={tn('home')} items={[{ label: author.name }]} />

      <h1 className="t-h1 max-w-[18ch]">{author.name}</h1>
      <p className="t-lead mt-3 max-w-[58ch]">{author.credentials}</p>

      <dl className="mt-8 divide-y" style={{ borderColor: 'var(--line)' }}>
        {facts.map((f) => (
          <div key={f.label} className="grid gap-1 sm:grid-cols-[190px_1fr] py-3">
            <dt className="text-[0.875rem] text-muted">{f.label}</dt>
            <dd className="text-[0.9375rem]">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="prose-guide mt-8">
        <p>{pick(author.bio)}</p>
      </div>

      <section className="mt-8 notice">
        <h2 className="text-[0.9375rem] font-semibold">{t('licensing')}</h2>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed">{pick(author.licensing)}</p>
        <p className="mt-3 text-[0.875rem] leading-relaxed">{t('reviewNote')}</p>
      </section>

      <section className="mt-10 pt-6 border-t border-line">
        <h2 className="t-h3">{t('articles')}</h2>
        {articles.length === 0 ? (
          <p className="mt-3 text-[0.9375rem] text-muted">{t('noArticles')}</p>
        ) : (
          <ul className="mt-4 divide-y" style={{ borderColor: 'var(--line)' }}>
            {articles.map((a) => (
              <li key={a.id} className="py-3">
                <Link href={`/guides/${a.slug}`} className="group block">
                  <span className="font-semibold group-hover:text-brand-800 transition-colors">
                    {a.title}
                  </span>
                  <span className="block text-[0.8125rem] text-muted mt-0.5">
                    {a.review.reviewed_at
                      ? tg('reviewedSelf', { name: author.name }).slice(0, 60)
                      : tg('notReviewed', { name: author.name }).slice(0, 78)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
