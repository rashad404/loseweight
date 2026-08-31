import type { RoutineItem, RoutineMeal, UserRoutine } from '../../lib/routine/models.ts';

let n = 0;
const id = (p: string) => `${p}-${++n}`;

export function item(
  rawText: string,
  kcal: number,
  opts: { protein?: number; fiber?: number; nonNegotiable?: boolean; name?: string } = {},
): RoutineItem {
  const { protein = 0, fiber = 0, nonNegotiable = false, name = rawText } = opts;
  return {
    id: id('item'),
    rawText,
    nonNegotiable,
    portion: { asDescribed: rawText, grams: 100, household: null, confidence: 'medium' },
    match: {
      id: id('match'), source: 'usda', name, confidence: 'medium',
      nutrition: {
        kcalLow: Math.round(kcal * 0.9), kcalHigh: Math.round(kcal * 1.1),
        proteinLowG: protein, proteinHighG: protein,
        fiberLowG: fiber, fiberHighG: fiber,
      },
    },
  };
}

export const meal = (slot: RoutineMeal['slot'], items: RoutineItem[]): RoutineMeal => ({
  id: id('meal'), slot, whenDescribed: null, items,
});

export function routine(meals: RoutineMeal[], over: Partial<UserRoutine> = {}): UserRoutine {
  return {
    version: 1, capturedAt: '2026-01-01T00:00:00Z', sourceText: null, confirmed: true,
    meals, nonNegotiables: [], cooking: 'sometimes', eatingOut: 'weekly',
    hungriest: 'evening', activityDescribed: null, ...over,
  };
}

/** A US routine: heavy cooking fat, a sugary drink, a large dinner portion. */
export const usRoutine = () => routine([
  meal('breakfast', [item('white bread', 160, { protein: 5 }), item('butter', 145)]),
  meal('lunch', [item('pasta', 420, { protein: 12, fiber: 3 }), item('olive oil', 240)]),
  meal('dinner', [item('chicken breast', 330, { protein: 60 }), item('white rice', 300, { protein: 5 })]),
  meal('drink', [item('cola', 210)]),
]);

/** An Azerbaijani routine built around plov, with tea the user will not give up. */
export const azRoutine = () => routine([
  meal('breakfast', [item('pendir', 110, { protein: 6 }), item('lavash', 160, { protein: 5, fiber: 2 })]),
  meal('lunch', [item('plov', 640, { protein: 26, fiber: 2 })]),
  meal('dinner', [item('dovga', 220, { protein: 9, fiber: 2 })]),
  meal('drink', [item('sweet tea', 120, { nonNegotiable: true })]),
], { hungriest: 'afternoon' });
