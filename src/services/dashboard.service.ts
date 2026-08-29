import { prisma } from "../lib/prisma.js";
import { getTransactions } from "./transaction.service.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const getSummary = async (
  userId: string,
  currency: string,
  month: number,
  year: number,
) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "INCOME",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpenses = Number(expenseResult._sum.amount ?? 0);
  const totalBalance = totalIncome - totalExpenses;

  const recent = await getTransactions(userId, { page: 1, limit: 5 });

  return {
    period: {
      month,
      year,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    },
    overview: {
      totalBalance: totalBalance.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      currency,
    },
    recentTransactions: recent.items,
  };
};