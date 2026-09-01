# Adaptive system build, progress

Tracks the build order in [new-plan.md](new-plan.md). Update the status column as
each step lands. Do not mark a step done until it has been tested, not merely written.

| # | Step | Status |
| --- | --- | --- |
| 1 | Update policies and safety boundaries | **done**, 14 safety tests |
| 2 | Structured models: user routine, meal, food match, plan change, weekly plan | **done** |
| 3 | Food provider abstraction | **done**, 11 tests, USDA + 12 curated AZ dishes |
| 4 | Deterministic change-selection rules | **done**, 17 tests, 7 rules |
| 5 | Natural-language parsing with correction UI | **done**, 95 TS + 42 PHP tests |
| 6 | Side-by-side original versus modified | not started |
| 7 | Save accepted changes | not started |
| 8 | `/today` | not started |
| 9 | Connect tracker and adaptive review engine | not started |
| 10 | Situation-based assistance | not started |

## How a food becomes a number

1. The model reads the person's words and returns a searchable English name in
   context ("yağ" eaten with bread and cheese is butter, not oil), or, for a
   dish, an ingredient list with gram ranges. It never returns nutrition.
2. Curated tables answer first, but only when they account for every meaningful
   word. "white brined cheese" is not allowed to match the `cheese` entry and
   come back as cheddar.
3. Anything left goes to USDA, ranked by whether the record actually answers the
   word. If nothing clearly wins, the user picks and the item counts as zero
   until they do. Ingredients inside a dish take the best match instead, since
   asking someone to choose a record for the onion in their plov is the wrong
   question, and the composition lists every record it used.
4. Deterministic code does all the arithmetic and owns every safety decision.

A model's dish composition is never promoted to fact by use. "Plov" is not one
recipe, and gram estimates are the weakest thing a model produces, so a
composition stays `generated` until a person reviews it. Confirmations are
counted, not treated as evidence: agreement with a default is not review.

## Standing constraints

- **AI lives in the Laravel API, never the frontend.** The API owns the key, the
  durable parse cache and the spend ledger, because a cap held in a Node process
  resets on restart and is therefore not a cap. The frontend runs the
  deterministic parser locally, which needs no secret and costs nothing.
- **Deterministic code owns every number and every safety decision.** AI parses
  language, proposes candidate mappings, and writes explanations. It never sets a
  threshold, never invents a calorie target, and never decides eligibility.
  Enforced in `frontend/lib/safety/boundaries.ts`.
- **No rigid seven-day menus.** Meal templates with interchangeable choices.
- **Never present a mixed dish as an exact calorie value.** Ranges with provenance.
- **Three locales, written natively.** Azerbaijani and Russian are not translations
  of the English. Azerbaijani needs Rashad's review before it ships.
- **UI and UX are a first-class requirement**, not a finishing pass.

## Open items requiring the owner

- `reviewed_at` is null on every guide. Only Rashad can set it.
- `hello@loseweight.net` must receive mail.
- AI parsing is live. Measured cost: about $0.0021 per onboarding parse on
  Haiku, roughly $2.12 per 1000. Misspelled foods parse correctly but will not
  match a nutrition source, which the correction UI is there to handle.
- The 34 curated foods in `frontend/lib/food/usda.ts` were each verified
  against FoodData Central by fdcId. Re-verify before adding to that table:
  several original entries cited an id for the raw food while quoting the
  cooked figure, and one cited butter for cheese.
- **Recipe candidates need a reviewer.** Every composition in
  `recipe_candidates` is currently `generated`, meaning a model proposed it and
  nobody has checked it. They are shown to users as proposals, with their
  assumptions, and are never presented as established figures. Promoting one to
  `reviewed` is a decision only Rashad can make.
- Azerbaijani assumption text is model-written. It is correct Azerbaijani rather
  than Turkish now, but it reads formally ("fərz edilmişdir"). Needs review
  against the localization rules.
- Russian has never had a native review.

## Decisions already made

- **Scope**: personalized nutrition, portion, activity and behaviour guidance is
  in scope as general wellness. Diagnosis, disease treatment, medication and
  supplement recommendations or dosing, symptom interpretation, contradicting a
  clinician, emergencies, and personalized plans for minors, pregnancy,
  breastfeeding or active eating disorders are out of scope. Canonical wording
  lives in `frontend/content/policies/scope.ts`.
- **Author**: Rashad Mirzayev is represented as educated at Azerbaijan Medical
  University with a pediatric background in Azerbaijan, currently in the US and
  not licensed there. He does not provide individual medical care through the
  product.
