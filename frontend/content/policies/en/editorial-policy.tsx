import { Link } from '@/i18n/navigation';

export const meta = {
  title: 'Editorial policy',
  description:
    'How guides are sourced, reviewed, and corrected, what personalized guidance the product does and does not give, and how commercial content is kept separate.',
};

export default function EditorialPolicy() {
  return (
    <>
<p>
          These are the rules we hold ourselves to. They exist because health content is
          easy to write badly and the cost of getting it wrong falls on the reader.
        </p>

        <h2>Sources</h2>
        <p>
          Claims are backed by primary sources: FDA labels, NIH resources, clinical
          guidelines, systematic reviews, and major peer reviewed studies. Citations are
          attached to the specific claims they support rather than piled at the bottom as
          decoration. Before a guide goes up, every cited source is checked to confirm it
          exists and actually says what we claim it says.
        </p>
        <p>
          Where the evidence is limited or contested, the page says so. We distinguish what
          is well established from what is emerging.
        </p>

        <h2>Review status is stated honestly</h2>
        <p>
          Each guide records who wrote it, who reviewed it, that reviewer&apos;s credentials and
          licensing jurisdiction, and the review date. Guides that have not yet been reviewed
          by a clinician display a notice saying exactly that at the top of the page. We do
          not fill in a reviewer name to make a badge look better, and we do not imply
          review that has not happened.
        </p>

        <h2>Languages</h2>
        <p>
          Guides are written separately in each language, not machine translated. A guide
          written in one language does not appear in another version of the site. Translating
          medical claims without re-checking them against sources in that language is a good
          way to introduce errors nobody catches.
        </p>

        <h2>What the product personalizes, and what it will not</h2>
        <p>
          The planner and the weekly plan give personalized guidance about food choices,
          portions, activity, and habits. That is general wellness guidance, not medical
          care. The full boundary, including the situations where we decline to generate a
          plan at all, is set out in the{' '}
          <Link href="/medical-disclaimer">medical disclaimer</Link>.
        </p>

        <h2>Limits we do not cross</h2>
        <ul>
          <li>No diagnosis, no treatment of disease, and no interpretation of symptoms as a diagnosis.</li>
          <li>No medication or supplement recommendations, and no dosing for either.</li>
          <li>Nothing that contradicts advice your own clinician has given you.</li>
          <li>No personalized plan for anyone under 18, during pregnancy or breastfeeding, or with an active or suspected eating disorder.</li>
          <li>No promises about how much or how fast you will lose weight.</li>
          <li>No fabricated patient stories, quotations, statistics, or credentials.</li>
          <li>No before and after hype, shame, or moral framing about food or body size.</li>
          <li>Person first, respectful language throughout.</li>
        </ul>
        <p>
          Pages say when a reader should see a clinician, and when a symptom warrants urgent
          care rather than a calculator.
        </p>

        <h2>Money</h2>
        <p>
          Advertising, affiliate links, and sponsorships are disclosed on the page where they
          appear. Commercial relationships have no influence on how a treatment is described
          or ordered. We do not rank anything because it pays a commission. The calculators
          have no commercial content in them at all.
        </p>

        <h2>Before anything is published</h2>
        <p>Three separate passes, in this order:</p>
        <ol>
          <li>Factual accuracy. Every claim traced to a source that supports it.</li>
          <li>Readability. The page is read aloud, and anything that sounds generic, repetitive, or promotional is rewritten.</li>
          <li>Medical safety. Would a clinician be comfortable with a patient reading this without supervision?</li>
        </ol>
        <p>
          AI tools assist with research, organization, and editing. They are not the final
          medical authority, and nothing is published without human review.
        </p>

        <h2>Corrections</h2>
        <p>
          When we get something wrong we fix it and note the change on the page. Reports of
          medical errors are handled ahead of everything else.
        </p>
    </>
  );
}
