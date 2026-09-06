import { prisma } from "../lib/prisma.js";
import { TransactionType } from "../generated/prisma/enums.js";
import { detectAnomaly } from "../algorithms/zScoreAnomaly.js";

export interface MonthlySpending {
  year: number;
  month: number;
  total: number;
}

export interface SpendingData {
  currentSpending: number;
  historicalSpending: number[];
}

export interface ZScoreAnalyticsResult {
  status:
    | "ANALYZED"
    | "INSUFFICIENT_DATA"
    | "TOO_EARLY";

  message: string;

  currentSpending: number;
  historicalSpending: number[];

  mean?: number;
  standardDeviation?: number;
  zScore?: number;
  isAnomaly?: boolean;
}

// 1. Get monthly expense totals
export async function getMonthlySpending(
  userId: string
): Promise<MonthlySpending[]> {
  const now = new Date();

  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();

  // Look back 6 months from the current month.
  const startDate = new Date(
    Date.UTC(
      currentYear,
      currentMonth - 6,
      1
    )
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: {
        gte: startDate,
        lte: now,
      },
    },
    select: {
      amount: true,
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const monthlyTotals = new Map<string, MonthlySpending>();

  // Create entries for the current month
  // and previous 6 months.
  for (let i = 0; i <= 6; i++) {
    const date = new Date(
      Date.UTC(
        currentYear,
        currentMonth - i,
        1
      )
    );

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;

    const key = `${year}-${month}`;

    monthlyTotals.set(key, {
      year,
      month,
      total: 0,
    });
  }

  // Add transaction amounts to their respective months.
  for (const transaction of transactions) {
    const year = transaction.date.getUTCFullYear();
    const month = transaction.date.getUTCMonth() + 1;
    const day = transaction.date.getUTCDate();

    // Only compare the same day range across months.
    if (day > currentDay) {
      continue;
    }

    const key = `${year}-${month}`;

    const existing = monthlyTotals.get(key);

    if (existing) {
      existing.total += Number(transaction.amount);
    }
  }

  return Array.from(monthlyTotals.values()).sort(
    (a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }

      return a.month - b.month;
    }
  );
}

// 2. Separate current month from historical months
export function prepareZScoreData(
  monthlySpending: MonthlySpending[]
): SpendingData {
  const now = new Date();

  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  const currentMonthData = monthlySpending.find(
    (item) =>
      item.year === currentYear &&
      item.month === currentMonth
  );

  // Only include historical months that have
  // actual spending data.
  const historicalSpending = monthlySpending
    .filter(
      (item) =>
        (item.year !== currentYear ||
          item.month !== currentMonth) &&
        item.total > 0
    )
    .map((item) => item.total);

  return {
    currentSpending: currentMonthData?.total ?? 0,
    historicalSpending,
  };
}

// 3. Run Z-Score analysis
export async function analyzeSpending(
  userId: string
): Promise<ZScoreAnalyticsResult> {
  const now = new Date();

  const currentDay = now.getUTCDate();

  const monthlySpending =
    await getMonthlySpending(userId);

  const {
    currentSpending,
    historicalSpending,
  } = prepareZScoreData(monthlySpending);

  // Do not generate anomaly alerts
  // before the 5th day of the month.
  if (currentDay < 5) {
    return {
      status: "TOO_EARLY",
      message:
        "Spending anomaly analysis will be available after the 5th day of the month.",
      currentSpending,
      historicalSpending,
    };
  }

  // Require at least 6 historical months.
  if (historicalSpending.length < 6) {
    return {
      status: "INSUFFICIENT_DATA",
      message:
        "Keep tracking your expenses to unlock spending anomaly insights.",
      currentSpending,
      historicalSpending,
    };
  }

  // Run the actual Z-Score algorithm.
  // const result = detectAnomaly({
  //   currentSpending,
  //   historicalSpending,
  // });

  // return {
  //   status: "ANALYZED",
  //   message: result.isAnomaly
  //     ? "Your spending is significantly higher than usual."
  //     : "Your spending is within your normal range.",
  //   currentSpending: result.currentSpending,
  //   historicalSpending,
  //   mean: result.mean,
  //   standardDeviation: result.standardDeviation,
  //   zScore: result.zScore,
  //   isAnomaly: result.isAnomaly,
  // };
  const result = detectAnomaly({
  currentSpending,
  historicalSpending,
});


return {
  status: "ANALYZED",
  message: result.isAnomaly
    ? "Your spending is significantly higher than usual."
    : "Your spending is within your normal range.",
  currentSpending: result.currentSpending,
  historicalSpending,
  mean: result.mean,
  standardDeviation: result.standardDeviation,
  zScore: result.zScore,
  isAnomaly: result.isAnomaly,
};
}