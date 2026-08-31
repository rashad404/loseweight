Proceed with the policy decision first, then build the first complete product slice.

Policy decision:

LoseWeight.net may provide personalized nutrition, meal-structure, portion, activity, and behavior guidance for general wellness and weight management.

It must not provide:

* Diagnosis
* Treatment of disease
* Medication recommendations
* Medication or supplement dosing
* Interpretation of symptoms as a diagnosis
* Advice that contradicts a clinician
* Guidance for medical emergencies
* Personalized plans for minors
* Personalized plans during pregnancy or breastfeeding
* Personalized plans for active or suspected eating disorders
* Disease-specific therapeutic diets without appropriate professional involvement

Update the Editorial Policy, Medical Disclaimer, Privacy Policy, Terms, onboarding consent, and product copy consistently.

Use language similar to:

"LoseWeight.net provides personalized educational guidance about food choices, portions, activity, habits, and weight-management planning. This is general wellness guidance, not medical care, diagnosis, or treatment. The service does not establish a physician-patient relationship."

Do not imply that Rashad Mirzayev provides individual medical care through the product. Represent his education, pediatric background in Azerbaijan, and lack of US licensure accurately.

Build a hybrid first slice, not a no-AI prototype and not an AI-controlled health system.

Core boundary:

* Deterministic code calculates calorie ranges, protein, fiber, weight projections, adjustment limits, exclusions, and safety decisions.
* Verified food data supplies nutritional values.
* AI parses natural-language meal descriptions, resolves ambiguity, proposes candidate mappings, explains changes, and writes user-facing language.
* AI must never independently create safety thresholds or clinical rules.

First product slice:

1. Preserve the current public homepage and planner.
2. After saving a plan, offer a short onboarding flow.
3. Ask only five initial questions:

   * What do you normally eat on a typical day?
   * Which foods or drinks will you not give up?
   * How often do you cook?
   * How often do you eat outside the home?
   * When are you usually most hungry?
4. Allow one natural-language response instead of many separate fields.
5. Use AI to convert that response into structured meals and ingredients.
6. Show the interpretation to the user before calculating anything.
7. Let the user correct portions, foods, and misunderstood items.
8. Map recognized foods to a verified nutrition source.
9. Display uncertainty where matching is incomplete.
10. Generate exactly three practical changes.
11. Show the original routine beside the modified routine.
12. Explain the expected benefit of each change.
13. Allow the user to reject or replace any change.
14. Save the accepted changes as the first weekly plan.
15. Create `/today` using that accepted plan.

The first "wow" screen must answer:

* What can I keep eating?
* What exactly should I change?
* Why were these changes selected?
* How much difference could they reasonably make?
* What can I choose instead?
* Can I realistically follow this with my schedule?

Do not generate a rigid seven-day menu.

Use meal templates:

* Normal breakfast with a specific modification
* Several interchangeable lunch choices
* Several interchangeable dinner choices
* Planned snack options
* One flexible meal
* Eating-out rules
* Hunger rescue options

Food data strategy:

* Create a food-provider abstraction.
* Start with USDA FoodData Central for common US foods.
* Add a curated local dataset for Azerbaijani foods.
* Store culturally specific dishes as recipes composed of ingredients, with portion ranges and uncertainty.
* Never pretend a mixed dish has an exact calorie value.
* Allow users to save their own corrected foods and recipes.
* Keep food-source provenance with every nutritional estimate.

Do not use a static swap table as the entire intelligence layer. A curated rules library should constrain and rank changes, while AI interprets the user's language and explains the selected deterministic result.

Examples of deterministic change rules:

* Reduce high-calorie cooking fat before removing staple foods.
* Preserve non-negotiable foods when possible.
* Prefer portion changes over total prohibition.
* Add protein or fiber when satiety is likely insufficient.
* Replace liquid calories when the user accepts the change.
* Do not recommend several difficult changes simultaneously.
* Do not reduce calories below established safety boundaries.
* Do not increase activity using an arbitrary step target without baseline activity.
* Do not change the plan based on one or two weigh-ins.

AI cost controls:

* Use a small model for parsing, classification, and routine responses.
* Use structured outputs.
* Cache parsed foods and repeated meals.
* Save accepted interpretations so the same meal is not repeatedly processed.
* Limit context to structured summaries rather than full conversation history.
* Apply per-user daily limits.
* Set server-side spending caps.
* Track cost by feature and user.
* Do not promise unlimited AI at a fixed price until usage data exists.

Testing:

* Build seeded user profiles covering US and Azerbaijani foods.
* Include ambiguous portions, mixed dishes, restaurant meals, missing information, and misspellings.
* Simulate onboarding corrections.
* Simulate accepted and rejected changes.
* Simulate six weeks of weigh-ins, hunger, adherence, and difficulty.
* Verify that deterministic adjustment rules remain within safety limits.
* Verify that AI explanations match the deterministic result.
* Test English and Azerbaijani independently, not through literal translation.

Build order:

1. Update policies and safety boundaries.
2. Define the structured user-routine, meal, food-match, plan-change, and weekly-plan models.
3. Implement the food-provider abstraction.
4. Implement deterministic change-selection rules.
5. Add natural-language parsing with correction UI.
6. Build the side-by-side original-versus-modified result.
7. Save accepted changes.
8. Build `/today`.
9. Connect the existing tracker and adaptive review engine.
10. Add situation-based assistance after the core flow works.

Do not wait a week to assess the implementation. Create automated simulations and usability fixtures now. Build the complete first slice, test it, and report:

* Files changed
* Policies changed
* Safety rules implemented
* Food sources used
* AI calls and estimated cost
* Ambiguous food cases
* Simulation results
* Known limitations
* Items requiring owner confirmation
