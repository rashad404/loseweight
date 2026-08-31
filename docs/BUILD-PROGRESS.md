# Adaptive system build, progress

Tracks the build order in [new-plan.md](new-plan.md). Update the status column as
each step lands. Do not mark a step done until it has been tested, not merely written.

| # | Step | Status |
| --- | --- | --- |
| 1 | Update policies and safety boundaries | **done**, 14 safety tests |
| 2 | Structured models: user routine, meal, food match, plan change, weekly plan | in progress |
| 3 | Food provider abstraction | not started |
| 4 | Deterministic change-selection rules | not started |
| 5 | Natural-language parsing with correction UI | not started |
| 6 | Side-by-side original versus modified | not started |
| 7 | Save accepted changes | not started |
| 8 | `/today` | not started |
| 9 | Connect tracker and adaptive review engine | not started |
| 10 | Situation-based assistance | not started |

## Standing constraints

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
- No AI provider key is configured, so parsing runs through a deterministic
  fallback until one exists. Real AI call count is therefore zero so far.
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
