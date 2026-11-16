export interface ShotCalculationInput {
  currentWeight: number; // Scale reading ("half mass" in formula)
  emptyWeight: number;   // Empty bottle weight
  fullWeight: number;    // Full bottle weight
  volume: number;        // Bottle volume in ml
  shooterSize: number;   // Shop shooter size in ml
}

export function calculateRemainingShots({
  currentWeight,
  emptyWeight,
  fullWeight,
  volume,
  shooterSize,
}: ShotCalculationInput): { shots: number; remainingMl: number; percentage: number } {
  const liquidWeightRange = fullWeight - emptyWeight;
  if (liquidWeightRange <= 0 || shooterSize <= 0) {
    return { shots: 0, remainingMl: 0, percentage: 0 };
  }

  const netLiquidWeight = Math.max(0, currentWeight - emptyWeight);
  const ratio = Math.min(1, netLiquidWeight / liquidWeightRange);
  const remainingMl = ratio * volume;
  const shots = remainingMl / shooterSize;

  return {
    shots: Math.floor(shots),
    remainingMl: Number(remainingMl.toFixed(1)),
    percentage: Math.floor(ratio * 100),
  };
}