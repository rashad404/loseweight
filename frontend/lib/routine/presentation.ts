const MEAL_SLOTS = new Set(['breakfast', 'lunch', 'dinner', 'snack', 'drink']);
const HUNGER_TIMES = new Set(['morning', 'afternoon', 'evening', 'late-night', 'varies']);

/** Translate enum-valued message parameters while preserving user food names and numbers. */
export function localizedChangeParams(
  params: Record<string, string | number>,
  translate: (key: string) => string,
): Record<string, string | number> {
  const localized = { ...params };
  if (typeof params.meal === 'string' && MEAL_SLOTS.has(params.meal)) localized.meal = translate(`meal.${params.meal}`);
  if (typeof params.when === 'string' && HUNGER_TIMES.has(params.when)) localized.when = translate(`when.${params.when}`);
  return localized;
}
