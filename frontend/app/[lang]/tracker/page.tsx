import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Tracker from '@/components/tools/Tracker';

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'tracker' });
  return {
    title: t('title'),
    description: t('intro'),
    alternates: { canonical: `/${lang}/tracker` },
  };
}

export default async function TrackerPage({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations({ locale: lang, namespace: 'tracker' });

  return (
    <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-12 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <h1 className="t-h1 max-w-[16ch]">{t('title')}</h1>
        <p className="t-lead mt-4 max-w-[58ch]">{t('intro')}</p>
      </header>
      <Tracker />
    </div>
  );
}
