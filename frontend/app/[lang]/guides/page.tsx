import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { fetchCategories, fetchGuides } from '@/lib/api/guides';
import Newsletter from '@/components/ui/Newsletter';

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'guides' });
  return {
    title: t('title'),
    description: t('intro'),
    alternates: { canonical: localePath(lang, '/guides') },
  };
}

export default async function GuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { lang } = await params;
  const { category } = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: 'guides' });
  const [guides, categories] = await Promise.all([
    fetchGuides(lang, { category }),
    fetchCategories(lang),
  ]);

  return (
    <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="t-h1 max-w-[16ch]">{t('title')}</h1>
        <p className="t-lead mt-4 max-w-[58ch]">{t('intro')}</p>
      </header>

      {categories.length > 0 && (
        <nav className="mt-7 flex flex-wrap gap-2">
          <Link
            href="/guides"
            className={`btn ${!category ? 'btn-primary' : 'btn-ghost'} text-sm py-1.5 px-3.5`}
          >
            {t('allCategories')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/guides?category=${cat.slug}`}
              className={`btn ${category === cat.slug ? 'btn-primary' : 'btn-ghost'} text-sm py-1.5 px-3.5`}
            >
              {cat.name}
              <span className="text-xs opacity-70">{cat.guides_count}</span>
            </Link>
          ))}
        </nav>
      )}

      {guides.length === 0 ? (
        <div className="mt-10 panel p-8 max-w-2xl">
          <p className="font-semibold">{t('empty')}</p>
          <p className="mt-2 text-sm text-muted leading-relaxed">{t('emptyNote')}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="panel p-5 hover:border-brand-500 transition-colors group flex flex-col"
            >
              {guide.category && (
                <span className="text-xs font-semibold text-brand-800 uppercase tracking-wide">
                  {guide.category.name}
                </span>
              )}
              <h2 className="mt-1.5 font-semibold leading-snug group-hover:text-brand-800 transition-colors">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3 flex-1">
                {guide.excerpt}
              </p>
              <p className="mt-3 text-xs text-muted">
                {t('readingTime', { minutes: guide.reading_minutes })}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-14">
        <Newsletter source="guides" />
      </div>
    </div>
  );
}
