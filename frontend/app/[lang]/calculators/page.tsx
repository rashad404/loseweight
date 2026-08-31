import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'calculators' });
  return {
    title: t('title'),
    description: t('intro'),
    alternates: { canonical: localePath(lang, '/calculators') },
  };
}

export default async function CalculatorsPage({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations({ locale: lang, namespace: 'calculators' });
  const tp = await getTranslations({ locale: lang, namespace: 'planner' });

  const items = [
    { href: '/planner', title: tp('title'), desc: tp('intro'), featured: true },
    { href: '/calculators/tdee', title: t('tdee'), desc: t('tdeeDesc') },
    { href: '/calculators/bmi', title: t('bmi'), desc: t('bmiDesc') },
    { href: '/calculators/waist-to-height', title: t('whtr'), desc: t('whtrDesc') },
    { href: '/calculators/protein', title: t('protein'), desc: t('proteinDesc') },
    { href: '/calculators/plateau', title: t('plateau'), desc: t('plateauDesc') },
  ];

  return (
    <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="t-h1 max-w-[16ch]">{t('title')}</h1>
        <p className="t-lead mt-4 max-w-[58ch]">{t('intro')}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`panel p-5 hover:border-brand-500 transition-colors group ${
              item.featured ? 'sm:col-span-2 lg:col-span-3 border-brand-400' : ''
            }`}
          >
            <h2 className="font-semibold group-hover:text-brand-800 transition-colors">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
