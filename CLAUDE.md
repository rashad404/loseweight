# LoseWeight.net

Free, evidence-based weight loss tools. The product is the planner: enter your details,
get a realistic timeline, calorie range, weekly milestones, and a projection chart.
Articles exist to bring people into the tools, not the other way round.

Positioning: "LoseWeight.net - Calculate a realistic, evidence-based path to your goal weight."

## Stack

Monorepo, modeled on `~/projects/satisaz`.

| Part | Tech | Local port | Tailscale |
| --- | --- | --- | --- |
| `backend/` | Laravel 13, PHP 8.4, MySQL, Sanctum | 8044 | http://100.89.150.50:8044/api |
| `frontend/` | Next.js 16, React 19, TypeScript, Tailwind 4, next-intl | 3044 | http://100.89.150.50:3044 |

Start both with `./restart.sh`. Logs land in `/tmp/lw-frontend.log` and `/tmp/lw-backend.log`.

Local database is MySQL `loseweight` (root/root). Seed with
`cd backend && php artisan migrate:fresh --seed`.

## Architecture decisions

- **Calculators run entirely in the browser.** `frontend/lib/health/calculations.ts` is
  pure TypeScript with no I/O. No body measurement reaches the server unless a signed-in
  member explicitly saves a plan. Do not move this logic to the API.
- **The projection model recalculates expenditure every simulated week** and applies
  metabolic adaptation scaled to weight lost. This is the product's whole differentiator
  against fixed-rate calculators. Changing its constants changes a medical-adjacent
  claim, so read the comments in that file before touching them.
- **English has no URL prefix.** `localePrefix` is `as-needed`, so English is served
  from the root (`/planner`) while other locales keep theirs (`/az/planner`). Build every
  canonical, hreflang and sitemap URL with `localePath()` from `i18n/routing.ts` rather
  than interpolating `/${lang}`, or English pages will advertise `/en/...` URLs that
  308 elsewhere.
- **Guides are per language, never translated.** A guide has one `language` and is
  invisible in other locales rather than falling back. `Guide::scopeInLanguage` and the
  `lang` query parameter enforce this. Interface strings are localized in
  `frontend/messages/*.json`; article bodies are not.
- **Review status is honest.** `reviewer_name`, `reviewer_credentials` and `reviewed_at`
  stay null until a named clinician actually signs a guide off. Unreviewed guides render
  a visible notice. Never populate those fields to remove the badge.
- **No charting library.** `components/tools/ProjectionChart.tsx` is hand-rolled SVG,
  because page weight matters for search traffic.

## Brand

The master logo is `brand/loseweight-logo.png`. Everything in
`frontend/public/brand/` is derived from it, so regenerate rather than editing
the derivatives by hand.

Exact logo colors: mint `#0bd3bf`, violet `#6353e9`, ink `#131c26`. The whole
palette in `globals.css` is built from these. Mint only reaches 1.8:1 against the
page background, so it is a fill color with dark text on top, never text itself.
Use `brand-800` (`#0a7469`, 5.5:1) for brand-colored text on light surfaces; a
rule in `globals.css` automatically swaps it for `brand-400` inside `.band-dark`.

`components/ui/Logo.tsx` renders both light and dark lockups and swaps them with
CSS, not JavaScript, so there is no flash before the stored theme is read. Pass
`variant="onDark"` on surfaces that stay dark in both themes, like the footer.

## Typography and design

Body and display are both Geist, self-hosted via `next/font`. It covers Latin, Latin
Extended (ə, ğ, ş, ı) and Cyrillic, so all three locales share one family. Display
weight is 800 with tight negative tracking rather than a second display face.

Design tokens live in `frontend/app/globals.css`. Use the `.t-*` type scale, `.panel`,
`.band-dark`, `.segment` and `.btn-*` classes rather than ad hoc Tailwind stacks.

## SEO

`.claude/skills/seo/SKILL.md` holds the standing rules. Invoke it before launching new
pages or a new locale. The parts easiest to break:

- Build every canonical, hreflang and sitemap URL with `localePath()` / `lib/seo.ts`.
- Policy pages are English-only prose. Non-English versions are `noindex` and excluded
  from both the sitemap and the hreflang cluster. When one is genuinely translated, add
  its locale to `translated` in `policyMetadata()`.
- Only emit `BreadcrumbList` where visible breadcrumbs render. Never add schema for
  content the page does not show.

## Content rules

Two documents govern all copy, and both are binding:

- [docs/EDITORIAL.md](docs/EDITORIAL.md) - voice, sourcing, medical safety, and the
  character rules. The rules below are the canonical statement of them.
- [docs/LOCALIZATION-AZ.md](docs/LOCALIZATION-AZ.md) - Azerbaijani is written, not
  translated. Word-for-word translation from English is the failure mode to avoid.

Run `cd frontend && npm run lint:copy` before committing copy. It checks characters,
banned phrases, American spellings, and Cyrillic hiding inside Latin words. It cannot
judge voice, so read the page aloud as well.

## Deployment

cPanel, user `ugn`, mirroring satis.az. See [docs/DEPLOY.md](docs/DEPLOY.md).

---

## Use these editorial rules for every page on LoseWeight.net:

* Write for a real person trying to make a decision, not for a search engine.
* Answer the main question within the first two or three sentences.
* Use clear, natural American English.
* Prefer short sentences, but vary sentence and paragraph length naturally.
* Use contractions where appropriate: “don’t,” “you’re,” and “it’s.”
* Speak directly to the reader using “you.”
* Be calm, practical, and medically responsible.
* Sound like a knowledgeable physician explaining something to an intelligent patient.
* Avoid academic language when an ordinary word works.
* Explain necessary medical terms immediately after introducing them.
* Include specific examples, numbers, tradeoffs, and realistic scenarios.
* Acknowledge uncertainty instead of presenting everything as absolute.
* Clearly distinguish established evidence from emerging or limited evidence.
* Mention meaningful disadvantages, risks, inconvenience, cost, and limitations.
* Do not make every section perfectly symmetrical or mechanically structured.
* Use headings only when they help readers navigate the page.
* Avoid unnecessary introductions, summaries, and repetitive conclusions.
* Avoid repeating the same fact using slightly different wording.
* Avoid stuffing exact search phrases into headings or paragraphs.
* Never add text merely to increase article length.
* Do not begin with phrases such as “In today’s world” or “When it comes to.”
* Avoid clichés such as “game-changer,” “journey,” “unlock,” “revolutionize,” “delve,” “empower,” and “navigate the complexities.”
* Avoid excessive use of “Additionally,” “Moreover,” “Furthermore,” and “It is important to note.”
* Avoid exaggerated adjectives such as “incredible,” “powerful,” “amazing,” and “groundbreaking.”
* Do not use artificial transitions between every paragraph.
* Do not overuse em dashes, colons, bold text, bullet lists, or rhetorical questions.
* Never fabricate personal experience, patient stories, quotations, statistics, research, or medical credentials.
* Never claim that the author personally tested a treatment unless that is true and documented.
* Do not imitate another writer or intentionally introduce spelling and grammar mistakes.
* Cite primary sources whenever possible: FDA labels, NIH resources, clinical guidelines, systematic reviews, and major peer-reviewed studies.
* Attach citations directly to the claims they support.
* Confirm that every cited source exists and actually supports the statement.
* Include publication and medical-review dates.
* Identify the author and reviewer honestly, including jurisdiction and licensing limitations.
* Do not provide an individual diagnosis, prescription, dosage change, or personalized medication recommendation.
* Explain when a reader should consult a licensed clinician or seek urgent care.
* Never promise a specific amount or speed of weight loss.
* Avoid shame, fear, moral judgment, and before-and-after hype.
* Use respectful, person-first language.
* State conflicts of interest, sponsorships, and affiliate relationships clearly.
* Keep commercial considerations separate from treatment rankings.
* Never rank a treatment or provider solely because it pays a commission.
* Before publishing, perform three separate reviews: factual accuracy, natural readability, and medical safety.
* Read the final page aloud and rewrite anything that sounds repetitive, generic, promotional, or unnatural.
* Remove any sentence that could appear unchanged on hundreds of unrelated health websites.
* Add original value to every page through a calculator, comparison, decision framework, verified data, or a clinically useful explanation.
* Use AI to assist with research, organization, and editing—not as the final medical authority.
* Require human review before publication.


There are no definitive "AI characters," but these often make text look machine-produced: em dashes, excessive semicolons, decorative arrows, emojis, smart quotes, overly polished headings, and repetitive formatting.



## Formatting and character rules:

* Do not use em dashes or en dashes.
* Use commas, periods, parentheses, or ordinary hyphens instead.
* Use straight quotation marks and apostrophes.
* Do not use decorative Unicode symbols.
* Do not use arrows, checkmarks, stars, or emojis.
* Avoid semicolons unless genuinely necessary.
* Do not use nonbreaking spaces or invisible Unicode characters.
* Use standard numbered and bulleted lists.
* Do not bold several phrases within every section.
* Avoid headings written as questions unless readers genuinely ask that question.
* Do not capitalize every important word.
* Do not use identical paragraph lengths or repeated section patterns.
* Avoid formulaic structures such as introduction, five equal sections, and conclusion on every page.
* Do not end every article with a generic motivational statement.
* Run a final text-normalization check before publishing.
* Allow only ordinary letters, numbers, standard punctuation, medically necessary symbols, and properly formatted units.
* Preserve necessary symbols such as %, degrees, mathematical operators, and medication units.
* Verify every medical claim and citation before publication.

I would keep the final verification rule even without mandatory human review. Medical misinformation is a much bigger SEO and liability risk than text sounding like AI.


Azerbaijani localization rules:

* Do not translate English text word for word.
* First understand what the text is trying to communicate, then rewrite it as a native Azerbaijani speaker would naturally say it.
* Translate the meaning and purpose, not the original sentence structure.
* Prefer language commonly used in Azerbaijan, not literal dictionary equivalents.
* Keep interface labels short, clear, and immediately understandable.
* Avoid awkward compound nouns created by copying English UI terminology.
* Do not preserve English word order when it sounds unnatural in Azerbaijani.
* Rewrite slogans and questions completely when a direct translation feels artificial.
* Consider where the text appears: navigation label, button, heading, explanation, error message, or call to action.
* Buttons should describe the action clearly.
* Headings should communicate the benefit or question naturally.
* Navigation labels should use terms familiar to ordinary Azerbaijani users.
* Use a warm, simple, and respectful tone.
* Avoid overly formal, bureaucratic, literary, or Turkish-sounding language.
* Do not use Russian or Turkish constructions unless they are also natural in Azerbaijani.
* Keep established medical terms accurate, but explain unfamiliar terminology plainly.
* After drafting, ask: "Would a person in Azerbaijan naturally say this in conversation or expect to see it on a local website?"
* If the answer is no, rewrite it from scratch.
* Never publish a phrase merely because it is grammatically correct. It must also sound natural and communicate a clear meaning.

Replace unnatural examples as follows:

* "Tərəqqi izləyicisi" -> "Nəticələrinizi izləyin" or "Çəki izləmə"
* "Bu, əslində nə qədər çəkəcək?" -> "Hədəfinizə nə vaxt çata bilərsiniz?"
* "Bələdçilər" -> "Faydalı məlumatlar" or "Məqalələr"
* "Çəki itkisi səyahətiniz" -> "Arıqlama prosesiniz"
* "Başlamağa hazırsınız?" -> "İndi başlaya bilərsiniz"
* "Hədəflərinizi kiliddən çıxarın" -> "Hədəfinizə doğru ilk addımı atın"
* "Fərdiləşdirilmiş anlayışlar" -> "Sizə uyğun tövsiyələr"
* "Tərəqqinizi qeyd edin" -> "Nəticələrinizi izləyin"
* "Daha çox öyrənin" -> "Ətraflı baxın" or "Ətraflı oxuyun"
* "Hesablamağa başlayın" -> "Hesabla"
* "Səyahətinizə başlayın" -> "Planınızı hazırlayın"

Choose the replacement according to context. Do not apply replacements mechanically.

Before publishing any Azerbaijani text:

* Read it independently without looking at the English source.
* Check whether its meaning is immediately clear.
* Remove anything that sounds translated.
* Shorten unnecessarily formal phrases.
* Confirm that terminology remains consistent across the website.
* Preserve Azerbaijani characters correctly: ə, ı, ö, ü, ş, ç, and ğ.


## git
- never mention any ai, claude etc
- use concise 1 sentence commit message