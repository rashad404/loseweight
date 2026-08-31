# Product audit, 2026-08-31

Every finding below was verified by running the flow, not by reading code. Where a
suspicion turned out to be wrong, that is recorded too.

## What genuinely works

- **The calculation engine.** `lib/health/calculations.ts` is pure, tested against hand
  worked examples, and the dynamic projection is the real differentiator. The adaptation
  model was retuned during this session (10% of expenditure produced 2.4x the naive
  estimate, which overstated the slowdown; it is now scaled to weight lost and capped at
  5%, about 95 kcal/day, giving 1.4x to 1.6x).
- **Per-language guide isolation.** An `az` guide 404s under English by design. Verified
  live in production.
- **The newsletter API.** `POST /api/subscribers` returns 201 and the row persists. This
  is more real than it looks.
- **SEO foundation.** Canonicals, hreflang with `x-default`, 50 sitemap URLs all
  returning 200, none `noindex`, Organization/WebSite/BreadcrumbList schema all parsing.
- **No mobile overflow.** Measured over CDP with real device metrics at 390px:
  `scrollWidth === clientWidth === 390` on home, privacy, tracker and planner. An earlier
  screenshot suggested clipping; that was a headless artifact, not a defect.

## What only appears to work

1. **"Save this plan" does not exist.** `savePlan`, `saved`, `signInToSave` and `signedIn`
   are all defined in `messages/*.json` and rendered by nothing. `Planner.tsx` contains
   zero `localStorage` calls.
2. **"Sign in to keep them across devices"** appears in the tracker. There is no sign-in
   UI anywhere, and `NEXT_PUBLIC_WALLET_CLIENT_ID` is empty. The claim is false.
3. **The newsletter promises a confirmation email.** The success state says "Check your
   inbox to confirm". `MAIL_MAILER=log`, nothing is sent, and `confirmed_at` is never
   populated. The capture is real; the confirmation is not.
4. **A whole backend nobody calls.** `/api/plan`, `/api/weight-entries` and `/api/auth/*`
   are fully implemented, migrated and routed. The frontend references them zero times.
5. **The hero result card is hardcoded.** Every visitor sees the same 88 kg to 72 kg,
   35-year-old example, presented in the visual language of a real result.

## What is incomplete

6. **The core workflow does not exist.** Plan and tracker share no state. You cannot save
   a plan, cannot compare actual weight against a projection, and cannot get an adjustment.
   This is the product, and it is the piece that is missing.
7. **The plateau analyzer makes the user do the analysis.** It asks "Weeks with no change
   in your 7 day average", which is the question it should be answering. It cannot see
   tracker data.
8. **No contact form.** The contact page lists an email address only.
9. **Policy pages render English prose under Azerbaijani and Russian chrome.** Now
   `noindex` and out of the sitemap, but still wrong for a human who lands there.
10. **Thin non-English locales.** 10 English guides, 2 Azerbaijani, 1 Russian.

## What looks template-generated or AI-written

11. **Guide titles carry the brand twice**: `... | LoseWeight.net | LoseWeight.net`. The
    seeded `meta_title` already appends it and the layout template appends it again.
12. **Uniform article length.** All ten English guides fall between 431 and 623 words,
    and nine of ten show "3 min read". Real editorial output is not that even.
13. **A generic author.** "LoseWeight.net Editorial" carries no accountability. Now
    fixable: `docs/author.md` supplies verified details.
14. **The homepage is a presentation, not a product.** Oversized headings, alternating
    light and near-black bands, a numbered tool list, a full article grid, a "What this
    site does not do" section, and a newsletter block, before the visitor has done
    anything useful.
15. **Two competing calls to action** in the hero.

## Accessibility defects

16. **No real form labels anywhere in the tools.** `components/tools/shared.tsx` renders
    `<span class="field-label">` with no `for`/`id` association. The tracker alone has
    five unlabeled inputs. This is the most serious accessibility problem on the site.
17. **No `inputMode` on numeric fields.** Six `type="number"` inputs in the planner, zero
    mobile keyboard hints.
18. **No accessible chart summary.** The projection chart is invisible to a screen reader
    beyond a single `aria-label`.

## Medically questionable phrasing

19. Overclaiming that the sources do not support as stated:
    - "the only mechanism by which anyone loses fat"
    - "suits most people"
    - "outperforms BMI for predicting cardiometabolic risk" stated without qualification
    - "always also high in micronutrients"
20. UI copy: "Most calculators give you a date you will miss" is a marketing claim
    presented as fact.

## What should be removed, combined, or promoted

- **Remove:** the static hero example card, the "What this site does not do" homepage
  section, the homepage article grid, the newsletter block on the homepage, the
  `signInToSave` and `signedIn` strings, and the manual "weeks flat" input.
- **Combine:** the BMI and waist-to-height calculators share one guide and answer one
  question ("which number should I track?"). They stay separate tools but must
  cross-reference rather than compete.
- **Promote to main product:** the plan, track, adjust loop. Calculators and guides
  become supporting material for it, reachable from the plan.

## Correction to an earlier claim

I previously reported the site as SEO-complete. The duplicated brand in guide titles was
present the whole time and I did not catch it because I checked page titles on routes
that build their title from `messages`, not on guide routes that build it from the
database. That was an incomplete check, not a regression.
