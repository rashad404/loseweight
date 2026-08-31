import { Link } from '@/i18n/navigation';

export const meta = {
  title: 'Corrections policy',
  description:
    'How LoseWeight.net handles errors: how to report one, how quickly we act on medical corrections, and how changes are recorded on the page.',
};

export default function Corrections() {
  return (
    <>
<p>
          Health content that stays wrong does real harm, so corrections get handled
          before anything else on this site. If you find an error, tell us and we will
          fix it.
        </p>

        <h2>How to report an error</h2>
        <p>
          Email hello@loseweight.net with the page address, the sentence you think is
          wrong, and, if you have one, a source that contradicts it. You don&apos;t need
          to be a clinician to report something, and you don&apos;t need to be certain.
        </p>

        <h2>What happens next</h2>
        <ol>
          <li>
            We check the claim against the sources cited on the page and against current
            guidance.
          </li>
          <li>
            If it&apos;s wrong, we correct it. Factual medical errors are fixed ahead of
            every other kind of work.
          </li>
          <li>
            The page records that it changed and what changed. We don&apos;t quietly edit
            a claim and leave the original review date in place.
          </li>
          <li>
            If it turns out to be right, we&apos;ll reply explaining why, with the
            source.
          </li>
        </ol>

        <h2>What counts as a correction</h2>
        <p>
          A factual error, a citation that doesn&apos;t support the claim attached to it,
          an out-of-date guideline, a broken calculation, or a translation that changes
          the meaning. Disagreement about emphasis or interpretation is worth raising too,
          though the outcome may be a clarification rather than a change.
        </p>

        <h2>Review status</h2>
        <p>
          Every guide states plainly whether a clinician has reviewed it, and guides that
          have not been reviewed say so at the top rather than implying an endorsement
          that doesn&apos;t exist. If you spot a page whose stated review status looks
          wrong, that is itself worth reporting. The standards we hold ourselves to are in
          the <Link href="/editorial-policy">editorial policy</Link>.
        </p>

        <h2>What we can&apos;t do</h2>
        <p>
          We can&apos;t give personal medical advice, interpret your results, or tell you
          whether a medication suits you. Those need a clinician with your history. If
          you&apos;re having a medical emergency, contact your local emergency number
          rather than emailing us.
        </p>
    </>
  );
}
