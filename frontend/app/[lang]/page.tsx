import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { fetchGuides } from '@/lib/api/guides';
import Newsletter from '@/components/ui/Newsletter';
import HeroExample from '@/components/home/HeroExample';
import { ArrowRight } from 'lucide-react';

export default async function HomePage({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: 'home' });
  const tc = await getTranslations({ locale: lang, namespace: 'calculators' });
  const tg = await getTranslations({ locale: lang, namespace: 'guides' });

  const guides = await fetchGuides(lang, { perPage: 6 });

  const tools = [
    { href: '/calculators/tdee', title: tc('tdee'), desc: tc('tdeeDesc') },
    { href: '/calculators/bmi', title: tc('bmi'), desc: tc('bmiDesc') },
    { href: '/calculators/waist-to-height', title: tc('whtr'), desc: tc('whtrDesc') },
    { href: '/calculators/protein', title: tc('protein'), desc: tc('proteinDesc') },
    { href: '/calculators/plateau', title: tc('plateau'), desc: tc('plateauDesc') },
  ];

  return (
    <>
      {/* Hero. One dark band, one very large headline, and a worked example
          rather than an empty column. */}
      <section className="band-dark">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:items-center">
            <div>
              <h1 className="t-display max-w-[15ch]">{t('heroTitle')}</h1>
              <p className="t-lead mt-7 max-w-[50ch]">{t('heroBody')}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/planner" className="btn btn-mint btn-lg">
                  {t('ctaPrimary')}
                  <ArrowRight size={19} />
                </Link>
                <Link href="/guides" className="btn btn-ghost btn-lg">
                  {t('ctaSecondary')}
                </Link>
              </div>

              <p className="mt-7 text-[0.8125rem] text-muted max-w-[54ch]">{t('privacyNote')}</p>
            </div>

            <HeroExample lang={lang} />
          </div>
        </div>
      </section>

      {/* The argument for the product, given room instead of squeezed into a panel. */}
      <section className="mx-auto max-w-[1160px] px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <h2 className="t-h1 max-w-[13ch] lg:sticky lg:top-24">{t('whyTitle')}</h2>
          <div className="max-w-[58ch] space-y-5 text-[1.0625rem] leading-relaxed">
            <p>{t('whyBody')}</p>
            <p className="text-muted">{t('whyBody2')}</p>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-800 hover:gap-2.5 transition-all"
            >
              {t('ctaPrimary')}
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Tools as a numbered list, not a grid of identical cards. */}
      <section className="sunken border-y border-line">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 sm:py-24">
          <p className="t-eyebrow">{t('toolsTitle')}</p>
          <h2 className="t-h1 mt-3 max-w-[18ch]">{t('toolsBody')}</h2>

          <ul className="mt-12">
            {tools.map((tool, i) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="group flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 py-6 border-t border-line"
                >
                  <span className="t-num text-[0.8125rem] text-muted w-8 shrink-0 pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="t-h3 sm:w-[19rem] shrink-0 group-hover:text-brand-800 transition-colors">
                    {tool.title}
                  </span>
                  <span className="text-[0.9375rem] text-muted max-w-[52ch] leading-relaxed">
                    {tool.desc}
                  </span>
                  <ArrowRight
                    size={18}
                    className="hidden sm:block ml-auto shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Guides. First one runs wide, the rest sit in a lighter grid. */}
      <section className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="t-eyebrow">{t('guidesTitle')}</p>
            <h2 className="t-h1 mt-3 max-w-[20ch]">{t('guidesBody')}</h2>
          </div>
          <Link href="/guides" className="btn btn-ghost">
            {t('allGuides')}
          </Link>
        </div>

        {guides.length === 0 ? (
          <p className="mt-10 text-muted">{t('noGuides')}</p>
        ) : (
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide, i) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className={`group border-t-2 pt-5 transition-colors hover:border-brand-500 ${
                  i === 0 ? 'sm:col-span-2 lg:col-span-3' : ''
                }`}
                style={{ borderTopColor: 'var(--line-strong)' }}
              >
                {guide.category && (
                  <span className="t-eyebrow">{guide.category.name}</span>
                )}
                <h3
                  className={`mt-2 font-bold tracking-[-0.025em] leading-[1.2] group-hover:text-brand-800 transition-colors ${
                    i === 0 ? 'text-[1.75rem] sm:text-[2.125rem] max-w-[22ch]' : 'text-[1.125rem]'
                  }`}
                >
                  {guide.title}
                </h3>
                <p
                  className={`mt-3 text-muted leading-relaxed ${
                    i === 0 ? 'text-[1.0625rem] max-w-[62ch]' : 'text-[0.9375rem] line-clamp-3'
                  }`}
                >
                  {guide.excerpt}
                </p>
                <p className="mt-4 text-[0.8125rem] text-muted">
                  {tg('readingTime', { minutes: guide.reading_minutes })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="band-dark">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr]">
            <h2 className="t-h1 max-w-[14ch]">{t('trustTitle')}</h2>
            <p className="t-lead max-w-[58ch]">{t('trustBody')}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20">
        <Newsletter source="home" />
      </section>
    </>
  );
}
