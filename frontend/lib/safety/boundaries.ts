/**
 * The safety boundary for personalized guidance.
 *
 * This file is the single source of truth. The policy pages describe what is
 * here; they do not define it. AI never evaluates these rules and never
 * produces a threshold: it may only explain a decision this module already made.
 */

export type Exclusion =
  | 'minor'
  | 'pregnant'
  | 'breastfeeding'
  | 'eating-disorder'
  | 'clinician-directed-diet'
  | 'medical-supervision';

export interface ScreeningAnswers {
  age: number;
  pregnantOrBreastfeeding: boolean;
  eatingDisorderHistory: boolean;
  clinicianDirectedDiet: boolean;
}

export interface ScreeningResult {
  /** True when a personalized plan may be generated. */
  eligible: boolean;
  exclusions: Exclusion[];
  /** Message key explaining the block, resolved in the caller's locale. */
  reasonKey: string | null;
}

/**
 * Personalized plans are withheld, not merely caveated, for the groups where
 * generic weight-loss guidance is most likely to cause harm. These people can
 * still read the guides and use the calculators.
 */
export function screen(answers: ScreeningAnswers): ScreeningResult {
  const exclusions: Exclusion[] = [];

  if (answers.age < 18) exclusions.push('minor');
  if (answers.pregnantOrBreastfeeding) exclusions.push('pregnant');
  if (answers.eatingDisorderHistory) exclusions.push('eating-disorder');
  if (answers.clinicianDirectedDiet) exclusions.push('clinician-directed-diet');

  return {
    eligible: exclusions.length === 0,
    exclusions,
    reasonKey: exclusions.length ? `safety.blocked.${exclusions[0]}` : null,
  };
}

/** Topics the product will not address, whatever the user asks. */
export const REFUSED_TOPICS = [
  'diagnosis',
  'disease-treatment',
  'medication-recommendation',
  'medication-dosing',
  'supplement-dosing',
  'symptom-interpretation',
  'contradicting-a-clinician',
  'medical-emergency',
  'therapeutic-diet',
] as const;

export type RefusedTopic = (typeof REFUSED_TOPICS)[number];

/**
 * Conservative keyword screen applied before any user text reaches a model, and
 * again to model output. It is intentionally over-inclusive: a false positive
 * costs one redirect to a clinician, a false negative costs a medical claim.
 */
const PATTERNS: Record<RefusedTopic, RegExp> = {
  diagnosis: /\b(do i have|am i (diabetic|hypothyroid|insulin resistant)|diagnos|is this (cancer|pcos|thyroid))\b/i,
  'disease-treatment': /\b(cure|treat(ing|ment)? (my|for) )\b/i,
  'medication-recommendation': /\b(should i (take|start|stop)|which (drug|medication)|prescribe|ozempic|wegovy|semaglutide|tirzepatide|mounjaro|metformin|phentermine|orlistat)\b/i,
  'medication-dosing': /\b(\d+\s?(mg|mcg|iu|units)\b|dose|dosage|titrat)/i,
  'supplement-dosing': /\b(how much .*(vitamin|supplement|creatine|magnesium)|\bmg of\b)/i,
  'symptom-interpretation': /\b(chest pain|dizzy|dizziness|fainted|palpitations|blood in|numbness|shortness of breath)\b/i,
  'contradicting-a-clinician': /\b(my doctor said|doctor told me|against my (doctor|dietitian))\b/i,
  'medical-emergency': /\b(emergency|can'?t breathe|passed out|suicidal|harm myself|overdose)\b/i,
  'therapeutic-diet': /\b(renal diet|dialysis|coeliac|celiac|crohn|ulcerative colitis|gastroparesis|chemo)\b/i,
};

export interface TopicScreen {
  allowed: boolean;
  topics: RefusedTopic[];
  /** Emergencies get a different, more urgent response than a plain refusal. */
  urgent: boolean;
}

export function screenTopics(text: string): TopicScreen {
  const topics = (Object.keys(PATTERNS) as RefusedTopic[]).filter((t) => PATTERNS[t].test(text));

  return {
    allowed: topics.length === 0,
    topics,
    urgent: topics.includes('medical-emergency') || topics.includes('symptom-interpretation'),
  };
}

/**
 * Hard numeric floors. Any generated plan is clamped to these regardless of
 * what a rule, a model, or a user preference asks for.
 */
export const SAFETY_LIMITS = {
  /** Never suggest a deficit larger than this share of maintenance. */
  maxDeficitFraction: 0.25,
  minIntake: { male: 1500, female: 1200 },
  /** Never suggest losing faster than this share of body weight per week. */
  maxWeeklyLossFraction: 0.01,
  /** At most this many behaviour changes at once. */
  maxSimultaneousChanges: 3,
  /** Weigh-ins required before the plan may be adjusted at all. */
  minWeighInsBeforeAdjusting: 9,
  /** Days of data required before the plan may be adjusted. */
  minDaysBeforeAdjusting: 21,
} as const;

export function clampIntake(intake: number, maintenance: number, sex: 'male' | 'female'): number {
  const floor = Math.max(
    SAFETY_LIMITS.minIntake[sex],
    Math.round(maintenance * (1 - SAFETY_LIMITS.maxDeficitFraction)),
  );
  return Math.max(intake, floor);
}
