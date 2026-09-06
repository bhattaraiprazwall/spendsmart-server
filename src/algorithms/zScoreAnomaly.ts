export interface ZScoreInput {
  currentSpending: number;
  historicalSpending: number[];
}

export interface ZScoreResult {
  currentSpending: number;
  mean: number;
  standardDeviation: number;
  zScore: number;
  isAnomaly: boolean;
}

export function detectAnomaly({
  currentSpending,
  historicalSpending,
}: ZScoreInput): ZScoreResult {
  // Validate current spending
  if (currentSpending < 0) {
    throw new Error("Current spending cannot be negative");
  }

  // Validate historical data
  if (historicalSpending.length < 2) {
    throw new Error(
      "At least 2 historical spending values are required"
    );
  }

  // Validate historical spending
  if (historicalSpending.some((amount) => amount < 0)) {
    throw new Error(
      "Historical spending cannot contain negative values"
    );
  }

  // 1. Calculate mean
  const mean =
    historicalSpending.reduce(
      (sum, value) => sum + value,
      0
    ) / historicalSpending.length;

  // 2. Calculate variance
  const variance =
    historicalSpending.reduce(
      (sum, value) => sum + Math.pow(value - mean, 2),
      0
    ) / historicalSpending.length;

  // 3. Calculate standard deviation
  const standardDeviation = Math.sqrt(variance);

  // 4. Calculate Z-Score
  let zScore: number;
  let isAnomaly: boolean;

  if (standardDeviation === 0) {
    zScore = 0;
    isAnomaly = currentSpending > mean;
  } else {
    zScore =
      (currentSpending - mean) / standardDeviation;

    isAnomaly = zScore > 2;
  }

  return {
    currentSpending,
    mean: Number(mean.toFixed(2)),
    standardDeviation: Number(
      standardDeviation.toFixed(2)
    ),
    zScore: Number(zScore.toFixed(2)),
    isAnomaly,
  };
}

// const result = detectAnomaly({
//   currentSpending: 5200,
//
//   historicalSpending: [
//     4000,
//     4500,
//     4200,
//     4800,
//     4300,
//   ],
// });
//
// console.log(result);