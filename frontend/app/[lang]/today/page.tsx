import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import TodayDashboard from '@/components/today/TodayDashboard';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'today' });

  return {
    title: t('title'),
    description: t('eatIntro'),
    alternates: alternatesFor(lang, '/today'),
    // Personal and stateful. Nothing here means anything to a cold visitor.
    robots: { index: false, follow: true },
  };
}

export default async function TodayPage({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <main className="mx-auto w-full max-w-[1160px] px-5 py-10 sm:px-8 md:py-14">
      <TodayDashboard locale={lang} />
    </main>
  );
}
