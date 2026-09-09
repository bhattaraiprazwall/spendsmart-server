import { prisma } from "../lib/prisma.js";
import { TransactionType } from "../generated/prisma/enums.js";
import {
  movingAverageForecast,
} from "../algorithms/movingAverageForecast.js";

export interface MonthlySpending {
  year: number;
  month: number;
  total: number;
}

export interface MovingAverageForecastResult {
  status: "FORECASTED" | "INSUFFICIENT_DATA";
  message: string;

  forecastYear?: number;
  forecastMonth?: number;

  historicalMonths: MonthlySpending[];

  windowSize: number;
  valuesUsed: number[];

  forecast?: number;
}
export async function getCompletedMonthlySpending(
  userId: string,
): Promise<MonthlySpending[]> {
  const now = new Date();

  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  // Start of the current month.
  // We only want completed months before this.
  const currentMonthStart = new Date(
    Date.UTC(
      currentYear,
      currentMonth,
      1,
    ),
  );

  // We need the previous 3 completed months.
  const startDate = new Date(
    Date.UTC(
      currentYear,
      currentMonth - 3,
      1,
    ),
  );

  const transactions =
    await prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: startDate,
          lt: currentMonthStart,
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

  // Create all three months with 0 spending first.
  const monthlyTotals =
    new Map<string, MonthlySpending>();

  for (let i = 3; i >= 1; i--) {
    const date = new Date(
      Date.UTC(
        currentYear,
        currentMonth - i,
        1,
      ),
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
    const month =
      transaction.date.getUTCMonth() + 1;

    const key = `${year}-${month}`;

    const existing = monthlyTotals.get(key);

    if (existing) {
      existing.total += Number(transaction.amount);
    }
  }

  return Array.from(
    monthlyTotals.values(),
  ).sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }

    return a.month - b.month;
  });
}

export async function forecastMonthlySpending(
  userId: string,
): Promise<MovingAverageForecastResult> {
  const monthlySpending =
    await getCompletedMonthlySpending(userId);

  const windowSize = 3;

  if (monthlySpending.length < windowSize) {
    return {
      status: "INSUFFICIENT_DATA",
      message:
        "Keep tracking your expenses to unlock monthly spending forecasts.",
      historicalMonths: monthlySpending,
      windowSize,
      valuesUsed: [],
    };
  }

  const historicalSpending =
    monthlySpending.map(
      (month) => month.total,
    );

  const result =
    movingAverageForecast({
      historicalSpending,
      windowSize,
    });

  const now = new Date();

  const forecastDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1,
    ),
  );

  return {
    status: "FORECASTED",

    message:
      "Your next month's spending has been forecasted using your recent spending history.",

    forecastYear:
      forecastDate.getUTCFullYear(),

    forecastMonth:
      forecastDate.getUTCMonth() + 1,

    historicalMonths:
      monthlySpending,

    windowSize:
      result.windowSize,

    valuesUsed:
      result.valuesUsed,

    forecast:
      result.forecast,
  };
}