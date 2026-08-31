# Editorial rules for LoseWeight.net

These rules apply to every page, guide, calculator label, and piece of UI copy on the
site. They are binding, not aspirational. Anything that violates them does not ship.

## Voice and substance

- Write for a real person trying to make a decision, not for a search engine.
- Answer the main question within the first two or three sentences.
- Use clear, natural American English.
- Prefer short sentences, but vary sentence and paragraph length naturally.
- Use contractions where appropriate: "don't", "you're", "it's".
- Speak directly to the reader using "you".
- Be calm, practical, and medically responsible.
- Sound like a knowledgeable physician explaining something to an intelligent patient.
- Avoid academic language when an ordinary word works.
- Explain necessary medical terms immediately after introducing them.
- Include specific examples, numbers, tradeoffs, and realistic scenarios.
- Acknowledge uncertainty instead of presenting everything as absolute.
- Clearly distinguish established evidence from emerging or limited evidence.
- Mention meaningful disadvantages, risks, inconvenience, cost, and limitations.

## Structure

- Do not make every section perfectly symmetrical or mechanically structured.
- Use headings only when they help readers navigate the page.
- Avoid unnecessary introductions, summaries, and repetitive conclusions.
- Avoid repeating the same fact using slightly different wording.
- Avoid stuffing exact search phrases into headings or paragraphs.
- Never add text merely to increase article length.
- Do not begin with phrases such as "In today's world" or "When it comes to".
- Do not end every article with a generic motivational statement.
- Avoid formulaic structures such as introduction, five equal sections, and conclusion
  on every page.
- Do not use identical paragraph lengths or repeated section patterns.

## Words to avoid

- Cliches: "game-changer", "journey", "unlock", "revolutionize", "delve", "empower",
  "navigate the complexities".
- Overused connectives: "Additionally", "Moreover", "Furthermore", "It is important to
  note".
- Exaggerated adjectives: "incredible", "powerful", "amazing", "groundbreaking".
- Do not use artificial transitions between every paragraph.

## Formatting and characters

- Do not use em dashes or en dashes. Use commas, periods, parentheses, or ordinary
  hyphens instead.
- Use straight quotation marks and apostrophes.
- Do not use decorative Unicode symbols, arrows, checkmarks, stars, or emojis.
- Avoid semicolons unless genuinely necessary.
- Do not use nonbreaking spaces or invisible Unicode characters.
- Use standard numbered and bulleted lists.
- Do not bold several phrases within every section.
- Avoid headings written as questions unless readers genuinely ask that question.
- Do not capitalize every important word in a heading.
- Do not overuse em dashes, colons, bold text, bullet lists, or rhetorical questions.
- Allow only ordinary letters, numbers, standard punctuation, medically necessary
  symbols, and properly formatted units.
- Preserve necessary symbols such as %, degrees, mathematical operators, and
  medication units.

Run `npm run lint:copy` in `frontend/` to check the character rules mechanically. It
does not judge voice, only characters.

## Medical safety and honesty

- Never fabricate personal experience, patient stories, quotations, statistics,
  research, or medical credentials.
- Never claim that the author personally tested a treatment unless that is true and
  documented.
- Do not imitate another writer or intentionally introduce spelling and grammar
  mistakes.
- Cite primary sources whenever possible: FDA labels, NIH resources, clinical
  guidelines, systematic reviews, and major peer-reviewed studies.
- Attach citations directly to the claims they support.
- Confirm that every cited source exists and actually supports the statement.
- Include publication and medical review dates.
- Identify the author and reviewer honestly, including jurisdiction and licensing
  limitations.
- **Personalized nutrition, portion, activity and behaviour guidance is in scope.** The
  product exists to give it. What follows are the limits on that, not a ban on it.
- Do not provide an individual diagnosis, treat disease, interpret symptoms as a
  diagnosis, recommend a medication or supplement, or suggest a dose for either.
- Do not contradict advice a reader's own clinician has given them, and do not attempt to
  help with a medical emergency.
- Do not generate a personalized plan for anyone under 18, during pregnancy or
  breastfeeding, for an active or suspected eating disorder, or a therapeutic diet for a
  diagnosed condition without a clinician involved. `frontend/lib/safety/boundaries.ts`
  enforces this in code; the copy describes it.
- Explain when a reader should consult a licensed clinician or seek urgent care.
- Never promise a specific amount or speed of weight loss.
- Avoid shame, fear, moral judgment, and before-and-after hype.
- Use respectful, person-first language.

## Commercial disclosure

- State conflicts of interest, sponsorships, and affiliate relationships clearly.
- Keep commercial considerations separate from treatment rankings.
- Never rank a treatment or provider solely because it pays a commission.

## Before publishing

1. Factual accuracy review. Every claim traced to a source that actually supports it.
2. Natural readability review. Read the page aloud. Rewrite anything that sounds
   repetitive, generic, promotional, or unnatural.
3. Medical safety review. Would a clinician be comfortable with a patient reading this
   unsupervised?

Then:

- Remove any sentence that could appear unchanged on hundreds of unrelated health sites.
- Confirm the page adds original value through a calculator, comparison, decision
  framework, verified data, or a clinically useful explanation.
- Run the text normalization check (`npm run lint:copy`).

Use AI to assist with research, organization, and editing. Not as the final medical
authority. Human review is required before publication.

## Where the boundary lives

`frontend/content/policies/scope.ts` holds the canonical scope statement in all three
languages. Every policy page and the onboarding consent render that same text, so the
wording cannot drift between them. `frontend/lib/safety/boundaries.ts` holds the
screening rules and numeric limits. Prose describes those files; it never restates them
from memory.

## How this is enforced in the product

A guide carries `reviewer_name`, `reviewer_credentials`, and `reviewed_at` in the
database. These stay empty until a named, licensed clinician has actually signed the
page off. Any guide without them renders a visible "not yet clinically reviewed" notice
rather than an implied endorsement. Never populate those fields to make the badge
disappear.
