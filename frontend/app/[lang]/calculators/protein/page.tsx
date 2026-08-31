import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { localePath } from '@/i18n/routing';
import ProteinCalculator from '@/components/tools/ProteinCalculator';

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'calculators' });
  return {
    title: t('protein'),
    description: t('proteinDesc'),
    alternates: { canonical: localePath(lang, '/calculators/protein') },
  };
}

export default async function Page({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations({ locale: lang, namespace: 'calculators' });

  const tn = await getTranslations({ locale: lang, namespace: 'nav' });

  return (
    <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-12 sm:py-16">
      <Breadcrumbs
        lang={lang}
        homeLabel={tn('home')}
        items={[
          { label: tn('calculators'), href: '/calculators' },
          { label: t('protein') },
        ]}
      />
      <header className="mb-10 max-w-3xl">
        <h1 className="t-h1 max-w-[16ch]">{t('protein')}</h1>
        <p className="t-lead mt-4 max-w-[58ch]">{t('proteinDesc')}</p>
      </header>
      <ProteinCalculator />
    </div>
  );
}
