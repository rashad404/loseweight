import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'onboarding' });

  return {
    title: t('title'),
    description: t('intro'),
    alternates: alternatesFor(lang, '/onboarding'),
    // Personal, stateful, and useless to a searcher landing cold.
    robots: { index: false, follow: true },
  };
}

export default async function OnboardingPage({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-12 sm:py-16">
      <OnboardingFlow />
    </div>
  );
}
