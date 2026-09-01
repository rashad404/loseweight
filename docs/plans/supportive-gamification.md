# Supportive gamification plan

Status: proposed  
Priority: begin after the first complete onboarding-to-`/today` product slice works  
Product rule: reward behaviors users control, and measure outcomes without judging them

## 1. Objective

Turn LoseWeight.net from a collection of useful tools into a responsive daily product that helps people follow a realistic plan.

The experience should have the energy and polish of a modern consumer startup: fast, colorful, personal, and satisfying to use. It must not become childish, noisy, manipulative, or medically careless.

Gamification supports the product loop:

1. The planner creates the strategy.
2. Onboarding turns the strategy into practical changes.
3. `/today` presents a small number of achievable actions.
4. Supportive feedback makes consistency visible and rewarding.
5. The tracker measures outcomes without scoring or judging them.
6. Weekly review adapts actions conservatively.

## 2. Success definition

The first release succeeds when a user can:

* See no more than three meaningful actions for today.
* Understand which actions are complete, available, or optional.
* Complete, shorten, replace, reschedule, or skip an action without punishment.
* Understand exactly how weekly momentum was calculated.
* See consistency across a rolling seven-day window.
* Receive specific feedback tied to something they actually did.
* Recover after an interrupted day or week without losing all visible progress.
* Complete one personalized weekly quest.
* See a fresh, modern visual state that evolves through consistent use.

The first release does not include public leaderboards, social comparison, virtual currency, competitive weight loss, or essential features locked behind achievements.

## 3. Non-negotiable safety rules

Never award or remove points based on:

* Weight, BMI, waist size, or body composition.
* Speed or amount of weight loss.
* Calorie intake or the size of a calorie deficit.
* Eating below a target.
* Completing consecutive weigh-ins.
* Exercising through pain, illness, exhaustion, or a planned recovery day.
* Performance relative to another person.

Momentum must not decrease because the user gained weight, ate above a target, missed a weigh-in, selected a maintenance week, or progressed more slowly than expected.

The product must not:

* Use sad, angry, disappointed, or shaming reactions.
* Describe a missed action as failure, cheating, falling behind, or breaking a streak.
* Encourage users to compensate for food with exercise or restriction.
* Create arbitrary activity targets without a known baseline.
* Let an AI model assign points, define thresholds, determine safety, or invent achievements.
* Hide safety guidance, core education, plan controls, data export, or account controls behind an unlock.

Users excluded from personalized planning by the existing safety boundaries must not enter the gamified plan flow.

## 4. Core experience

### 4.1 Today

`/today` is the main returning-user screen. It should answer, within one viewport:

* What matters today?
* What have I already done?
* What can I change if today is difficult?
* How is my week going?

Display a maximum of three primary actions. An action has one of these states:

* `available`: planned and ready to complete.
* `completed`: the user confirms it happened.
* `adjusted`: completed in a user-selected easier or equivalent form.
* `rescheduled`: deliberately moved to another appropriate day.
* `skipped_reasonable`: excluded from consistency because the user was sick, traveling, recovering, or the action was unsuitable that day.
* `skipped`: closed with neutral language but earns no credit.
* `optional`: helpful but not included in momentum.

Every available action must expose relevant alternatives. Depending on the action, these may be:

* Mark complete.
* Make it easier.
* Replace it.
* Move it.
* Skip for today.

Example:

> Today: 2 of 3 complete
>
> Breakfast change completed  
> Weight recorded  
> A 10-minute walk is still available
>
> Shorten it, move it, complete it today, or skip it.

Do not make weighing a daily required action. It can appear only on the schedule the user selected and never affects momentum.

### 4.2 Weekly momentum

Momentum measures engagement with selected behaviors, not health outcomes.

Use a transparent rolling seven-day count as the primary display:

```text
11 of 14 planned actions completed
```

The progress ring may calculate the underlying ratio as:

```text
earned action credits / available action credits * 100
```

Rules:

* Each primary action is worth one credit by default.
* A completed or adjusted action earns one credit.
* A deliberately rescheduled action remains neutral until its new date.
* A reasonable skip is excluded from both numerator and denominator when the user is sick, traveling, recovering, or the action was unsuitable. A reason category may be selected, but sensitive free-text disclosure must never be required.
* A regular skip earns zero credit and remains in the denominator. The interface uses neutral language and does not describe this as penalty-free.
* Optional actions are excluded from both numerator and denominator.
* Safety-directed rest, maintenance mode, illness pause, and actions removed by plan adjustment are excluded from the denominator.
* The UI shows the count, for example `11 of 14 planned actions completed`, as the primary value.

The percentage is secondary and may be omitted from visible copy. It can power the progress ring, but must not resemble a school grade. `Weekly momentum` refers to the count and ring together, never a health score, wellness score, adherence grade, or performance rating.

The visual landscape may change with the completed-to-planned ratio, but do not label performance bands unless user testing demonstrates that the labels are helpful and nonjudgmental.

### 4.3 Flexible consistency

Use rolling consistency instead of brittle streaks:

* Show `5 of the last 7 days` rather than `five-day streak` as the primary measure.
* Preserve lifetime and monthly personal records when one day is missed.
* Recognize returning after an interruption.
* Never display a broken-chain animation.

Example recovery feedback:

> You checked in again today. Returning is part of building a routine.

### 4.4 Weekly quest

Offer exactly one personalized quest at a time. A quest must be derived from the accepted weekly plan and deterministic rules.

Suitable quests include:

* Use the planned breakfast modification three times.
* Take two 10-minute walks after dinner.
* Choose one of the planned hunger-rescue options twice.
* Use the agreed eating-out rule once.
* Complete the weekly review.

Quest requirements:

* It must be achievable within seven days.
* It must not depend on weight change.
* It must not require buying a product.
* It must offer replacement or dismissal.
* It must explain why it was selected.
* It must not exceed the user's accepted activity baseline or safety limits.

### 4.5 Celebrations and personal records

Celebrate specific events, not routine taps and not generic excellence.

Good celebration triggers:

* First weekly review.
* First adjusted action, showing that flexibility is legitimate.
* Completing a weekly quest.
* Best rolling consistency this month.
* Returning after seven or more inactive days.
* Four weeks of honest weekly reviews.
* Adjusting a plan that the user reported as unrealistic.

Good copy:

> You used your breakfast change four times this week, one more than last week.

Avoid generic messages such as `You're crushing it`, `No excuses`, or `You failed to meet your goal`.

Confetti should be reserved for meaningful milestones, respect reduced-motion settings, and never block the next action.

### 4.6 Maintenance, pauses, and recovery

Maintenance is a core product mode, not a later option. The same daily-action and momentum system must support:

* Maintaining after reaching a goal.
* A planned maintenance break.
* Holidays and travel.
* Illness and recovery.
* Temporarily reducing effort.
* Stabilizing a plan that proved unrealistic.

Maintenance actions are rewarded identically to weight-loss-phase actions because momentum measures controllable participation, not weight change. The interface must identify maintenance explicitly and must not describe stable weight as stalled progress.

Pausing or reducing the plan must preserve prior records and earned visual progression. Actions removed during a pause are excluded from the denominator rather than recorded as missed.

## 5. Unlocks and progression

Progression can unlock only optional enhancements:

* Color themes.
* Visual landscape variations.
* Deeper nonessential charts.
* Additional dashboard personalization.
* Achievement collections.

Do not lock:

* Safety or medical information.
* Core nutrition education.
* Plan creation or adjustment.
* Today's actions.
* Recipes, meal alternatives, or other information needed to complete an action.
* Weekly review.
* Tracker functionality.
* Privacy controls, deletion, or export.
* Accessibility settings.

Use experience levels sparingly. Do not introduce coins, purchasable boosts, loot boxes, scarcity timers, or reward-loss mechanics.

## 6. Visual and interaction direction

The target is a credible wellness startup, not a hospital portal and not a children's game.

### Visual character

* Retain the brand mint and violet as anchors.
* Use mint for completion.
* Use sky blue for available actions.
* Use violet for achievements and progression.
* Use soft amber for attention that is not an error.
* Use coral for recovery, flexibility, and supportive interruption states.
* Use color in focused areas rather than painting every surface.
* Preserve strong contrast and never rely on color alone to communicate state.
* Give dark mode real color depth instead of converting the interface to gray.

### Startup feel

* The primary screen should feel immediate, personalized, and dynamic.
* Use large, confident numbers only for safe behavioral progress, such as `2 of 3`.
* Use layered cards, soft gradients, restrained glow, and generous spacing.
* Prefer direct manipulation: tap a card, mark it done, or reveal alternatives in place.
* Provide optimistic UI feedback for local actions.
* Keep navigation shallow and make `/today` the signed-in or returning-user home.
* Use short transitions between states rather than page reloads or modal-heavy flows.
* Use skeletons only when real network latency exists.
* Maintain a fast first render and avoid large animation or chart dependencies.

### Evolving visual landscape

Create an abstract landscape that develops from engagement: a path, horizon, sunrise, or growing field. It must remain mature and visually quiet.

The landscape reflects rolling participation, not body change. A low-activity week should look calm or early-stage, never damaged, dead, stormy, or sad. Progress already earned remains visible.

The first implementation should use CSS and lightweight SVG. Do not add a game engine or heavy illustration runtime.

### Motion

* Check completion: 180 to 240 ms.
* Progress ring update: 300 to 500 ms.
* Card reordering: subtle and spatially consistent.
* Milestone celebration: brief and dismissible.
* Fully respect `prefers-reduced-motion`.

## 7. Information architecture

Primary returning-user navigation:

* Today
* Plan
* Progress
* Learn

The main relationships are:

```text
Saved plan
  -> accepted weekly changes
     -> daily actions
        -> action check-ins
           -> weekly momentum and records
              -> weekly review
                 -> deterministic plan adjustment
```

Gamification is a presentation and feedback layer over this data. It must not become a second plan engine.

## 8. Data model

Names are illustrative and should be aligned with the implementation already in progress.

### DailyAction

```ts
interface DailyAction {
  id: string;
  weeklyPlanId: string;
  sourceChangeId: string | null;
  sourceType: 'accepted_change' | 'weekly_review' | 'user_created' | 'safety_adjustment';
  date: string;
  kind: 'meal' | 'activity' | 'habit' | 'review';
  title: string;
  rationale: string;
  state: 'available' | 'completed' | 'adjusted' | 'rescheduled' | 'skipped_reasonable' | 'skipped' | 'optional';
  creditEligible: boolean;
  completedAt: string | null;
  replacementActionId: string | null;
  rescheduledTo: string | null;
}
```

Every action must retain provenance and show it in plain language, such as `From the breakfast change you accepted this week`. No action may appear solely because a model generated it. AI can help express an action already created by an accepted change, deterministic weekly review, explicit user action, or safety adjustment.

### WeeklyQuest

```ts
interface WeeklyQuest {
  id: string;
  weeklyPlanId: string;
  ruleId: string;
  title: string;
  rationale: string;
  targetCount: number;
  currentCount: number;
  startsOn: string;
  endsOn: string;
  state: 'active' | 'completed' | 'replaced' | 'dismissed';
}
```

### ProgressSnapshot

```ts
interface ProgressSnapshot {
  weekStarting: string;
  earnedCredits: number;
  availableCredits: number;
  momentumPercent: number | null;
  activeDays: number;
  completedQuestId: string | null;
}
```

### Achievement

Achievements must be deterministic and versioned. Store the achievement definition ID, rule version, earned timestamp, and evidence IDs. Do not store only a user-facing label.

## 9. Deterministic behavior

All scoring and achievement evaluation must use pure, testable functions.

Required functions include:

* `calculateWeeklyMomentum(actions)`
* `calculateRollingConsistency(actions, days)`
* `selectWeeklyQuest(plan, recentActions, userPreferences)`
* `evaluateAchievements(history)`
* `buildSpecificFeedback(current, previous)`

AI may rewrite an approved deterministic explanation into natural language, but the UI must have a safe deterministic fallback. AI must not decide whether an achievement was earned or whether an action counts.

## 10. Copy system

Every state needs specific, native copy in English, Azerbaijani, and Russian. Do not translate enthusiasm word for word.

Copy principles:

* Describe what happened.
* Connect it to the person's accepted plan.
* Offer the next useful choice.
* Avoid moral judgment.
* Avoid exaggerated praise.
* Do not imply a behavior guarantees weight loss.
* Never fabricate social proof or a percentile.

State examples:

| State | Direction |
| --- | --- |
| Complete | `Breakfast change completed.` |
| Available | `A 10-minute walk is still available.` |
| Adjusted | `The shorter version counts. You kept the plan workable.` |
| Skipped | `Closed for today. You can continue tomorrow.` |
| Returned | `You checked in again today.` |
| Weekly review | `You completed 11 of 14 planned actions. Two were adjusted.` |

All final Azerbaijani copy requires native review before release. Russian requires independent native review.

## 11. Social features, later phase

Do not build a public leaderboard until there is sufficient real usage, privacy design, moderation capacity, and evidence that it helps the intended users.

Potential later features:

* Opt-in partner challenges.
* Private friend groups.
* Collective activity goals.
* Simple encouragement reactions.
* Cooperative consistency challenges.

Never compare weight, BMI, waist, calories, deficit, or speed of loss.

If comparative statistics are introduced:

* Use only real, consented, aggregated data.
* Set a minimum cohort size before displaying a statistic.
* Define a comparable cohort and time window.
* Explain the metric and calculation.
* Suppress sensitive or re-identifiable slices.
* Never generate or estimate a percentile for encouragement.

## 12. Analytics and evaluation

Measure whether the layer improves useful engagement without causing pressure.

Core events:

* `today_viewed`
* `action_completed`
* `action_adjusted`
* `action_rescheduled`
* `action_skipped_reasonable`
* `action_skipped`
* `quest_replaced`
* `quest_completed`
* `weekly_review_completed`
* `recovery_return`
* `celebration_dismissed`
* `gamification_disabled`

Do not send meal text, notes, weights, body measurements, or sensitive health text in analytics events.

Primary product metrics:

* Percentage completing a first action.
* Seven-day and four-week return rates.
* Weekly review completion.
* Frequency of adjustment versus abandonment.
* Quest replacement and completion rates.
* Return rate after an interrupted week.

Guardrail metrics:

* Gamification disable rate.
* Notification opt-out rate.
* Rapid repeated weigh-ins.
* Repeated action skipping after attention messaging.
* User reports of pressure, shame, confusion, or compulsive use.

Do not optimize for raw taps, time in app, maximum streak length, or fastest weight loss.

## 13. Accessibility and user control

* Every color state needs text and icon reinforcement.
* Progress rings need a plain-language accessible summary.
* Completion animations must not steal focus.
* All interactions must work by keyboard.
* Screen readers must receive one concise state update, not every animation frame.
* Respect reduced motion and increased contrast settings.
* Allow users to disable celebrations, momentum, achievements, and social features independently.
* The core plan and tracker must remain fully usable when all gamification is disabled.

## 14. Full-scope delivery plan

All phases below are part of the approved product scope. Phases control implementation order and integration risk; they do not remove achievements, progression, social features, synchronization, or analytics from the committed build. Each phase should leave the product usable while work continues on the next.

### Phase 0: foundation

Dependencies:

* Complete onboarding correction flow.
* Save accepted weekly changes.
* Establish `/today` and its daily-action model.

Deliverables:

* Final state vocabulary.
* Pure scoring specification.
* Copy review checklist.
* Analytics privacy specification.

### Phase 1: supportive daily loop

Build:

* Maximum-three-action `/today` layout.
* Complete, adjust, replace, reschedule, and skip controls.
* Progress ring.
* Rolling seven-day momentum with visible calculation.
* Recovery-friendly copy.
* Reduced-motion behavior.
* Disable-gamification setting that preserves the complete plan and tracker experience.
* Maintenance, pause, travel, illness, and recovery behavior.

### Phase 2: weekly engagement

Build:

* One deterministic weekly quest.
* Weekly review summary.
* Personal records.
* Specific milestone celebrations.
* Evolving visual landscape.

### Phase 3: progression and personalization

Build:

* Achievement collection.
* Cosmetic themes.
* Optional content unlocks.
* Dashboard personalization.

### Phase 4: cooperative social layer

Build opt-in partner challenges, private friend groups, collective goals, encouragement reactions, and cooperative consistency challenges after completing the required privacy, abuse, moderation, cohort, and notification work. Public competitive leaderboards remain out of scope.

### Phase 5: account synchronization and complete analytics

Build:

* Conflict-safe synchronization of actions, quests, progress snapshots, achievements, and preferences.
* Offline action completion with idempotent reconciliation.
* Migration from local-only history without losing provenance or records.
* The full privacy-conscious event model and product dashboards defined in this plan.
* Guardrail monitoring for pressure, compulsive use, notification fatigue, and gamification disablement.

Synchronization must not be required to use the core local-first product, and analytics must never include body measurements, meal text, notes, or other sensitive free text.

## 15. Test plan

### Unit tests

Verify:

* Momentum calculation for every action state.
* Optional and safety-removed actions do not affect the denominator.
* Weight and calorie data can never affect momentum.
* Rolling windows cross week and month boundaries correctly.
* Rescheduled actions cannot earn duplicate credit.
* Reasonable skips are excluded while regular skips remain in the denominator.
* Every action has an allowed, traceable source type and source record.
* Maintenance uses the same credit rules as active weight-loss planning.
* Time-zone changes do not duplicate or erase a day.
* Achievements are idempotent.
* Quest selection is deterministic and stays within plan constraints.

### Integration tests

Simulate:

* A fully completed week.
* A partially completed week.
* A maintenance week.
* Illness or recovery pause.
* Returning after an interruption.
* Replacing an unrealistic action.
* Local-only use and later account synchronization.
* Offline completion followed by synchronization.
* Locale and time-zone changes.

### Safety tests

Assert that:

* Weight loss never grants points or achievements.
* Low calorie intake never receives praise.
* Missed weigh-ins do not reduce momentum.
* Activity is not suggested when an exclusion or pause applies.
* No screen uses shame, compensation, or competitive body language.
* AI output cannot modify score or achievement state.

### Usability review

Test with people who are:

* New to weight management.
* Returning after repeated attempts.
* Using maintenance rather than loss mode.
* Managing irregular schedules.
* Using English and Azerbaijani independently.
* Sensitive to streak pressure or competitive fitness interfaces.

## 16. Release criteria

Phase 1 can ship only when:

* The complete planner-to-onboarding-to-`/today` flow works.
* All score calculations are deterministic and covered by tests.
* Users can see how momentum was calculated.
* Users can skip or adjust every action without a punitive response.
* The experience works with gamification disabled.
* Maintenance, pauses, and recovery preserve progress and calculate consistency correctly.
* Every displayed action exposes understandable provenance.
* Reduced motion, keyboard navigation, contrast, and screen-reader summaries pass review.
* Analytics contain no sensitive health values or free text.
* English copy passes editorial and safety review.
* Azerbaijani and Russian copy are withheld until their required native reviews are complete.

## 17. Decisions still requiring owner confirmation

* Whether momentum and achievements are stored locally first or require an account at launch.
* Whether activity data will be manual only or later connect to Apple Health, Google Health Connect, or wearables.
* Which visual landscape direction best fits the brand.
* Which cosmetic unlocks are valuable enough to build.
* Whether notifications are in scope and, if so, their default frequency and quiet hours.

## 18. Implementation sequence

Start with the daily foundation, then continue through every phase in Section 14:

1. Generate up to three daily actions from the accepted weekly plan.
2. Render them on `/today` with complete, adjust, move, and skip choices.
3. Calculate transparent seven-day momentum.
4. Show one modern progress ring and one lightweight evolving SVG landscape.
5. Add specific completion and recovery feedback.
6. Test the safety invariants and all action-state transitions.
7. Continue with quests, achievements, personalization, cooperative social features, synchronization, and complete analytics.

This ordering creates startup energy and daily responsiveness early while preserving the complete scope. Later mechanics still inherit the underlying plan, provenance, evidence, privacy, and safety rules rather than becoming an independent game system.
