export interface MovingAverageInput {
  historicalSpending: number[];
  windowSize?: number;
}

export interface MovingAverageResult {
  windowSize: number;
  valuesUsed: number[];
  forecast: number;
}

export function movingAverageForecast({
  historicalSpending,
  windowSize = 3,
}: MovingAverageInput): MovingAverageResult {
  // Validate window size
  if (windowSize < 1 || !Number.isInteger(windowSize)) {
    throw new Error(
      "Window size must be a positive integer",
    );
  }

  // Validate historical data length
  if (historicalSpending.length < windowSize) {
    throw new Error(
      `At least ${windowSize} historical spending values are required`,
    );
  }

  // Validate spending values
  if (
    historicalSpending.some(
      (amount) =>
        !Number.isFinite(amount) || amount < 0,
    )
  ) {
    throw new Error(
      "Historical spending must contain only non-negative numbers",
    );
  }

  // Take only the most recent values
  const valuesUsed =
    historicalSpending.slice(-windowSize);

  // Calculate total
  const total = valuesUsed.reduce(
    (sum, value) => sum + value,
    0,
  );

  // Calculate Simple Moving Average
  const forecast = total / windowSize;

  return {
    windowSize,
    valuesUsed,
    forecast: Number(forecast.toFixed(2)),
  };
}


///////////////////////Testing////////////////////////
const result = movingAverageForecast({
  historicalSpending: [4000, 4500, 5000],
});

console.log(result);