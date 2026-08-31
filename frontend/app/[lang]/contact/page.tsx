import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { policyMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;

  return policyMetadata({
    lang,
    path: '/contact',
    title: 'Contact and corrections',
    description: 'How to reach LoseWeight.net, how to report an error in a guide, and what we cannot answer. Corrections to medical content are handled ahead of everything else.',
  });
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="t-h1 max-w-[16ch]">Contact</h1>

      <div className="prose-guide mt-8">
        <p>Write to hello@loseweight.net.</p>

        <h2>Corrections</h2>
        <p>
          If something on this site is wrong, particularly a medical claim, please say so.
          Include the page and, if you have one, the source that contradicts it. Corrections
          to medical content are prioritized over everything else, and we note the change on
          the page.
        </p>

        <h2>What we cannot answer</h2>
        <p>
          We cannot give personal medical advice, interpret your test results, comment on
          whether a medication is right for you, or adjust a dose. Those questions need a
          clinician who can see your history. If you are in crisis or having a medical
          emergency, contact your local emergency number rather than emailing us.
        </p>
      </div>
    </div>
  );
}
