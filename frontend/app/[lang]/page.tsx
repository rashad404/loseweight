import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { fetchGuides } from '@/lib/api/guides';
import QuickStart from '@/components/home/QuickStart';
import { ArrowRight } from 'lucide-react';

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: 'home' });
  const tp = await getTranslations({ locale: lang, namespace: 'pages' });
  const tg = await getTranslations({ locale: lang, namespace: 'guides' });

  // Three, not the whole library. A full article directory on the homepage is a
  // sitemap, not a decision aid.
  const guides = (await fetchGuides(lang, { perPage: 3 })).slice(0, 3);

  const reasons = [
    { title: t('reason1Title'), body: t('reason1') },
    { title: t('reason2Title'), body: t('reason2') },
    { title: t('reason3Title'), body: t('reason3') },
  ];

  return (
    <>
      {/* The tool is the first thing on the page, not a description of it. */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <h1 className="t-h1 max-w-[20ch]">{t('quickTitle')}</h1>
          <p className="t-lead mt-3 max-w-[62ch]">{t('quickLead')}</p>

          <div className="mt-8">
            <QuickStart />
          </div>
        </div>
      </section>

      <section className="sunken border-b border-line">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-14">
          <h2 className="t-h2 max-w-[24ch]">{t('reasonsTitle')}</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {reasons.map((r, i) => (
              <div key={r.title}>
                <span className="t-num text-[0.75rem] text-muted">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="t-h3 mt-1.5">{r.title}</h3>
                <p className="mt-2 text-[0.9375rem] text-muted leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-14">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:gap-14">
            <div>
              <h2 className="t-h2 max-w-[16ch]">{t('loopTitle')}</h2>
              <p className="mt-3 text-[0.9375rem] text-muted leading-relaxed max-w-[52ch]">
                {t('loopBody')}
              </p>
              <Link
                href="/tracker"
                className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand-800 hover:gap-2.5 transition-all"
              >
                {t('loopCta')}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <ol className="space-y-0">
              {[t('loopStep1'), t('loopStep2'), t('loopStep3')].map((step, i) => (
                <li key={step} className="flex gap-4 py-4 border-t border-line">
                  <span className="t-num text-[0.8125rem] text-muted pt-0.5">{i + 1}</span>
                  <span className="text-[0.9375rem] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {guides.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-14">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="t-h2">{t('resourcesTitle')}</h2>
              <Link href="/guides" className="text-[0.9375rem] font-medium text-brand-800 hover:underline">
                {t('allGuides')}
              </Link>
            </div>

            <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-3">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <Link href={`/guides/${guide.slug}`} className="group block border-t border-line pt-4">
                    {guide.category && <span className="t-eyebrow">{guide.category.name}</span>}
                    <h3 className="mt-1.5 font-semibold leading-snug group-hover:text-brand-800 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="mt-2 text-[0.875rem] text-muted leading-relaxed line-clamp-2">
                      {guide.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section>
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-14">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1fr] lg:gap-14">
            <h2 className="t-h2 max-w-[16ch]">{t('trustTitle')}</h2>
            <div>
              <p className="text-[0.9375rem] text-muted leading-relaxed max-w-[58ch]">
                {t('trustBody')}
              </p>
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.875rem]">
                <Link href="/editorial-policy" className="text-brand-800 font-medium hover:underline">
                  {t('trustMethod')}
                </Link>
                <Link href="/medical-disclaimer" className="text-brand-800 font-medium hover:underline">
                  {t('trustDisclaimer')}
                </Link>
                <Link href="/about" className="text-brand-800 font-medium hover:underline">
                  {tp('about')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
