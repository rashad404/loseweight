import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';
import TodayDashboard from '@/components/today/TodayDashboard';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'nav' });
  return { title: t('today'), description: t('today'), alternates: { canonical: localePath(lang, '/today') }, robots: { index: false } };
}

export default async function TodayPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; setRequestLocale(lang);
  return <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-8 sm:py-12"><TodayDashboard locale={lang} /></div>;
}
