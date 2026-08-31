import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { policyMetadata } from '@/lib/seo';
import { POLICY_LOCALES, policyLocale } from '@/content/policies';
import EnContent, { meta as enMeta } from '@/content/policies/en/corrections';
import AzContent, { meta as azMeta } from '@/content/policies/az/corrections';
import RuContent, { meta as ruMeta } from '@/content/policies/ru/corrections';

const CONTENT = {
  en: { Body: EnContent, meta: enMeta },
  az: { Body: AzContent, meta: azMeta },
  ru: { Body: RuContent, meta: ruMeta },
} as const;

const SLUG = 'corrections' as const;

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const { meta } = CONTENT[policyLocale(SLUG, lang) as keyof typeof CONTENT];

  return policyMetadata({
    lang,
    path: `/${SLUG}`,
    title: meta.title,
    description: meta.description,
    // Written natively in every locale, so all three are indexable and belong
    // in the hreflang cluster.
    translated: POLICY_LOCALES[SLUG],
  });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  const { Body, meta } = CONTENT[policyLocale(SLUG, lang) as keyof typeof CONTENT];

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="t-h1 max-w-[18ch]">{meta.title}</h1>
      <div className="prose-guide mt-8">
        <Body />
      </div>
    </div>
  );
}
