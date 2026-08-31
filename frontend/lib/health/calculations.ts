/**
 * The calculation engine behind every tool on the site.
 *
 * Everything here is a pure function and runs in the visitor's browser: no
 * body measurement is ever sent to our servers unless a signed-in member
 * explicitly saves a plan.
 */

export type Sex = 'male' | 'female';

export interface ActivityLevel {
  id: string;
  factor: number;
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary', factor: 1.2 },
  { id: 'light', factor: 1.375 },
  { id: 'moderate', factor: 1.55 },
  { id: 'active', factor: 1.725 },
  { id: 'athlete', factor: 1.9 },
];

/** Energy in one kilogram of mixed body tissue lost in a deficit. */
export const KCAL_PER_KG = 7700;

/** Lowest daily intake we will ever recommend without clinical supervision. */
export const CALORIE_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };

/**
 * Mifflin-St Jeor resting metabolic rate — the best-validated predictive
 * equation for adults across the normal-to-obese range.
 */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (sex === 'male' ? 5 : -161);
}

/** Katch-McArdle — more accurate when body-fat percentage is actually known. */
export function bmrFromLeanMass(weightKg: number, bodyFatPercent: number): number {
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  return 370 + 21.6 * leanMass;
}

export function tdee(bmrValue: number, activityFactor: number): number {
  return bmrValue * activityFactor;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese1' | 'obese2' | 'obese3';

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'healthy';
  if (value < 30) return 'overweight';
  if (value < 35) return 'obese1';
  if (value < 40) return 'obese2';
  return 'obese3';
}

/** Weight range corresponding to a BMI of 18.5-24.9 at this height. */
export function healthyWeightRange(heightCm: number): { min: number; max: number } {
  const m = heightCm / 100;
  return { min: 18.5 * m * m, max: 24.9 * m * m };
}

export function waistToHeight(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

export type WhtrCategory = 'low' | 'healthy' | 'increased' | 'high';

export function whtrCategory(ratio: number): WhtrCategory {
  if (ratio < 0.4) return 'low';
  if (ratio < 0.5) return 'healthy';
  if (ratio < 0.6) return 'increased';
  return 'high';
}

/**
 * Protein target in grams per day.
 *
 * Above a BMI of about 30, scaling to current weight produces absurd numbers,
 * so we scale to goal weight instead — the standard clinical adjustment.
 */
export function proteinTarget(
  currentWeightKg: number,
  goalWeightKg: number,
  heightCm: number,
  age: number,
): { low: number; high: number; basis: 'current' | 'goal' } {
  const useGoal = bmi(currentWeightKg, heightCm) >= 30;
  const basisKg = useGoal ? goalWeightKg : currentWeightKg;

  // Older adults need the higher end to defend against sarcopenia in a deficit.
  const [lowFactor, highFactor] = useGoal
    ? [1.2, 1.5]
    : age >= 65
      ? [1.6, 2.0]
      : [1.6, 2.2];

  return {
    low: Math.round(basisKg * lowFactor),
    high: Math.round(basisKg * highFactor),
    basis: useGoal ? 'goal' : 'current',
  };
}

/** Fibre scales with intake, not body size: ~14 g per 1,000 kcal. */
export function fiberTarget(calories: number): number {
  return Math.round((calories / 1000) * 14);
}

export interface ProjectionPoint {
  week: number;
  weightKg: number;
  tdee: number;
  intake: number;
  deficit: number;
}

export interface Projection {
  points: ProjectionPoint[];
  weeksToGoal: number | null;
  goalReached: boolean;
  /** Weight the plan converges on if the goal is never reached. */
  plateauWeightKg: number;
  averageWeeklyLossKg: number;
  /** What a naive 7,700-kcal-per-kg straight line would have predicted. */
  naiveWeeksToGoal: number | null;
}

export interface ProjectionInput {
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  activityFactor: number;
  /** Fixed daily intake to simulate. */
  intake: number;
  maxWeeks?: number;
}

/**
 * Upper bound on metabolic adaptation, as a fraction of expenditure.
 *
 * Adaptation is applied in proportion to how much weight has actually been
 * lost, reaching this cap at a 10% body-weight reduction, which is the
 * reduction level the adaptive-thermogenesis literature is built on. At a
 * typical adult TDEE this works out to roughly 90 to 110 kcal/day, matching
 * the magnitudes usually reported.
 *
 * This was deliberately lowered from an earlier 10% cap. At 10%, applied to
 * total expenditure and stacked on the weight-driven decline in BMR, the model
 * predicted about 2.4x the naive linear estimate, which overstates the
 * slowdown. Being pessimistic is not the same as being accurate.
 */
const ADAPTATION_CAP = 0.05;
const ADAPTATION_FULL_AT_FRACTION_LOST = 0.10;

/**
 * Week-by-week projection that recalculates expenditure as the body changes.
 *
 * This is the whole point of the site. A linear "deficit / 7,700" model assumes
 * your TDEE never moves, which is why other calculators promise a date you
 * miss. Here, each simulated week:
 *
 *   1. recomputes BMR at the current weight,
 *   2. applies metabolic adaptation scaled to the weight lost so far,
 *   3. converts that week's energy deficit into tissue at 7,700 kcal/kg.
 *
 * The result decelerates and converges on a plateau, which is what happens to
 * people. It is still a model: it cannot know your individual expenditure, and
 * it assumes you hold the intake exactly.
 */
export function projectWeightLoss(input: ProjectionInput): Projection {
  const {
    sex, age, heightCm, startWeightKg, goalWeightKg,
    activityFactor, intake, maxWeeks = 260,
  } = input;

  const points: ProjectionPoint[] = [];
  let weight = startWeightKg;
  let weeksToGoal: number | null = null;

  const startTdee = tdee(bmr(sex, startWeightKg, heightCm, age), activityFactor);
  const startDeficit = startTdee - intake;

  points.push({
    week: 0,
    weightKg: weight,
    tdee: Math.round(startTdee),
    intake,
    deficit: Math.round(startDeficit),
  });

  for (let week = 1; week <= maxWeeks; week++) {
    const fractionLost = (startWeightKg - weight) / startWeightKg;
    const adaptation =
      startDeficit > 0
        ? Math.min(fractionLost / ADAPTATION_FULL_AT_FRACTION_LOST, 1) * ADAPTATION_CAP
        : 0;
    const weeklyTdee = tdee(bmr(sex, weight, heightCm, age), activityFactor) * (1 - adaptation);
    const dailyDeficit = weeklyTdee - intake;

    // Below ~40 kcal/day the plan has effectively converged; stop simulating.
    if (dailyDeficit <= 40) break;

    weight -= (dailyDeficit * 7) / KCAL_PER_KG;

    points.push({
      week,
      weightKg: Math.round(weight * 100) / 100,
      tdee: Math.round(weeklyTdee),
      intake,
      deficit: Math.round(dailyDeficit),
    });

    if (weeksToGoal === null && weight <= goalWeightKg) {
      weeksToGoal = week;
      break;
    }
  }

  const last = points[points.length - 1];
  const totalLost = startWeightKg - last.weightKg;

  const naiveWeeksToGoal =
    startDeficit > 0
      ? Math.ceil(((startWeightKg - goalWeightKg) * KCAL_PER_KG) / (startDeficit * 7))
      : null;

  return {
    points,
    weeksToGoal,
    goalReached: weeksToGoal !== null,
    plateauWeightKg: Math.round(last.weightKg * 10) / 10,
    averageWeeklyLossKg: last.week > 0 ? Math.round((totalLost / last.week) * 1000) / 1000 : 0,
    naiveWeeksToGoal,
  };
}

/**
 * Turn a desired weekly rate into a daily intake, clamped to what is safe:
 * never more than a 25% deficit, never below the sex-specific calorie floor.
 */
export function intakeForRate(
  tdeeValue: number,
  rateKgPerWeek: number,
  sex: Sex,
): { intake: number; clamped: 'none' | 'deficit' | 'floor' } {
  const requestedDeficit = (rateKgPerWeek * KCAL_PER_KG) / 7;
  const maxDeficit = tdeeValue * 0.25;

  let deficit = requestedDeficit;
  let clamped: 'none' | 'deficit' | 'floor' = 'none';

  if (deficit > maxDeficit) {
    deficit = maxDeficit;
    clamped = 'deficit';
  }

  let intake = Math.round(tdeeValue - deficit);

  if (intake < CALORIE_FLOOR[sex]) {
    intake = CALORIE_FLOOR[sex];
    clamped = 'floor';
  }

  return { intake, clamped };
}

/** Rate of loss that is sensible at a given starting BMI, in kg per week. */
export function suggestedRate(bmiValue: number): number {
  if (bmiValue >= 35) return 0.9;
  if (bmiValue >= 30) return 0.7;
  if (bmiValue >= 27) return 0.5;
  return 0.4;
}
