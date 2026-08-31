export type Units = 'metric' | 'imperial';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const inToCm = (inches: number) => inches * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;

/** Imperial height is entered as feet + inches, so keep the pair together. */
export const feetInchesToCm = (feet: number, inches: number) => inToCm(feet * 12 + inches);

export const cmToFeetInches = (cm: number) => {
  const totalInches = cmToIn(cm);
  const feet = Math.floor(totalInches / 12);
  return { feet, inches: Math.round((totalInches - feet * 12) * 10) / 10 };
};

export const displayWeight = (kg: number, units: Units, decimals = 1) =>
  units === 'metric'
    ? `${kg.toFixed(decimals)} kg`
    : `${kgToLb(kg).toFixed(decimals)} lb`;

export const weightValue = (kg: number, units: Units) =>
  units === 'metric' ? kg : kgToLb(kg);
