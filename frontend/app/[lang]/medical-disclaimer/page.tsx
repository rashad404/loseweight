import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'pages' });
  return { title: t('disclaimer'), alternates: { canonical: localePath(lang, '/medical-disclaimer') } };
}

export default async function DisclaimerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="t-h1 max-w-[16ch]">Medical disclaimer</h1>

      <div className="prose-guide mt-8">
        <p>
          LoseWeight.net provides general health information and calculators. It does not
          provide medical advice, diagnosis, or treatment, and nothing here creates a
          clinician and patient relationship.
        </p>

        <h2>Calculators are estimates</h2>
        <p>
          The equations used on this site are population averages. Predictive formulas for
          metabolic rate land within about 10% of measured expenditure for roughly two
          thirds of people, and further off for the rest. Treat any number here as a
          starting point to test against your own data, not a measurement of you.
        </p>

        <h2>Talk to a clinician before starting if any of these apply</h2>
        <ul>
          <li>You are pregnant or breastfeeding.</li>
          <li>You are under 18 or over 65.</li>
          <li>You have diabetes, kidney disease, liver disease, or heart disease.</li>
          <li>You have a history of an eating disorder, or calorie counting has previously affected your mental health.</li>
          <li>You take medication whose dose depends on body weight or food intake, including insulin, warfarin, thyroid hormone, or lithium.</li>
          <li>You have had bariatric surgery.</li>
          <li>You are losing weight without trying.</li>
        </ul>

        <h2>Seek urgent care if you have</h2>
        <ul>
          <li>Chest pain, severe shortness of breath, or fainting.</li>
          <li>Persistent vomiting or inability to keep fluids down.</li>
          <li>Confusion, severe weakness, or palpitations while restricting food.</li>
          <li>Thoughts of harming yourself.</li>
        </ul>

        <h2>Medications</h2>
        <p>
          Pages on this site describe drug classes in general terms and summarize published
          trial results. They are education, not a recommendation. We do not suggest that any
          particular medication is right for you, and we do not adjust doses. Those decisions
          belong with a clinician who has your full history.
        </p>

        <h2>Jurisdiction</h2>
        <p>
          Regulatory approvals, treatment thresholds, and available products differ by
          country. Information here is general and may not reflect the guidance or licensed
          indications where you live. Where a guide has been reviewed by a clinician, that
          clinician's licensing jurisdiction is stated on the page.
        </p>

        <h2>Accuracy and corrections</h2>
        <p>
          We aim to keep pages current and to cite primary sources. Medicine changes, and
          errors happen. If you find one, tell us and we will correct it and note the change.
        </p>
      </div>
    </div>
  );
}
