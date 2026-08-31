import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'pages' });
  return { title: t('about'), alternates: { canonical: `/${lang}/about` } };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="t-h1 max-w-[16ch]">About LoseWeight.net</h1>

      <div className="prose-guide mt-8">
        <p>
          LoseWeight.net is a free set of weight loss calculators and written guides. The
          point of the site is the planner: you enter your details and get a calorie range,
          a realistic date, and the week by week curve behind it, with the arithmetic shown
          so you can check it.
        </p>

        <h2>Why the site exists</h2>
        <p>
          Most weight loss calculators divide the weight you want to lose by a fixed weekly
          rate. That assumes your body burns the same energy at 90 kg as it does at 75 kg,
          which is not true. As you get lighter, daily expenditure falls, the same intake
          produces a smaller deficit, and progress slows. A calculator that ignores this
          gives you a date you will miss, and missing it is one of the most common reasons
          people quit.
        </p>
        <p>
          Every projection here recalculates expenditure as your simulated weight changes,
          and includes a modest allowance for metabolic adaptation. You can see the
          difference against the straight line estimate on your own numbers.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not diagnose you or provide personalized medical advice.</li>
          <li>We do not recommend, prescribe, or sell medications, and we do not link to pharmacies.</li>
          <li>We do not store your measurements. Calculators run in your browser.</li>
          <li>We do not promise a specific amount or speed of weight loss.</li>
        </ul>

        <h2>How guides are written</h2>
        <p>
          Guides are written separately for each language rather than machine translated. A
          guide written in Azerbaijani appears only to readers using the Azerbaijani version
          of the site, because a translated medical claim that nobody re-checked is worse
          than no article at all.
        </p>
        <p>
          Every guide carries its sources, and every guide states plainly whether a clinician
          has reviewed it. If the review has not happened yet, the page says so at the top
          rather than implying an endorsement that does not exist. Our full standards are in
          the <Link href="/editorial-policy">editorial policy</Link>.
        </p>

        <h2>How the site is funded</h2>
        <p>
          The tools are free and will stay free. Any advertising, affiliate link, or paid
          product on this site is disclosed on the page where it appears. Commercial
          relationships never affect how a treatment is described or ranked.
        </p>

        <h2>Contact</h2>
        <p>
          Corrections are welcome, particularly on anything medical. See the{' '}
          <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
