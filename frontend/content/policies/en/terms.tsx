import { Link } from '@/i18n/navigation';

export const meta = {
  title: 'Terms of use',
  description:
    'The terms for using LoseWeight.net: what the calculators are and are not, limits of liability, how accounts and saved plans work, and what you may reuse.',
};

export default function Terms() {
  return (
    <>
<p>
          By using LoseWeight.net you accept these terms. They are deliberately short.
          If you disagree with any of them, please don&apos;t use the site.
        </p>

        <h2>What this site is</h2>
        <p>
          A set of free calculators and written guides about weight loss. The calculators
          apply published equations to numbers you enter. They are estimates built on
          population averages, and they can be meaningfully wrong for any individual.
        </p>
        <p>
          Nothing here is medical advice, a diagnosis, or a treatment plan, and using the
          site does not create a clinician and patient relationship. See the{' '}
          <Link href="/medical-disclaimer">medical disclaimer</Link>, which forms part of
          these terms.
        </p>

        <h2>Your responsibility</h2>
        <p>
          You decide what to do with the output. Before making changes to how you eat,
          exercise, or take medication, check with a clinician who knows your history,
          particularly if any of the situations listed in the medical disclaimer apply
          to you.
        </p>

        <h2>Accounts and saved data</h2>
        <p>
          Signing in is optional. If you save a plan or sync weigh-ins, that data is tied
          to your account and you can delete it at any time. We may close an account that
          is used to attack, scrape, or disrupt the service. What we store is described
          in the <Link href="/privacy">privacy policy</Link>.
        </p>

        <h2>Availability</h2>
        <p>
          The site is provided as is. We don&apos;t guarantee it will be available,
          uninterrupted, or free of errors, and we may change or remove features. We
          correct mistakes when we find them, and we note the change on the page.
        </p>

        <h2>Liability</h2>
        <p>
          To the extent the law allows, we are not liable for loss arising from your use
          of this site or reliance on its content. Nothing here limits liability that
          cannot lawfully be limited, including for death or personal injury caused by
          negligence.
        </p>

        <h2>Content and reuse</h2>
        <p>
          The text, calculators, and design are ours. You are welcome to quote a short
          passage with a link back. Republishing whole guides, or copying the calculators,
          is not permitted without written permission. Cited studies belong to their
          publishers.
        </p>

        <h2>Changes</h2>
        <p>
          If these terms change in a way that affects you, we will say so on this page and
          date the change. Questions go to the <Link href="/contact">contact page</Link>.
        </p>
    </>
  );
}
