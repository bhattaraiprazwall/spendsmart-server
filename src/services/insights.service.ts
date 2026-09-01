import { prisma } from "../lib/prisma.js";

export const getCategoryBreakdown = async (
  userId: string,
  period: "Weekly" | "Monthly" | "Yearly",
) => {
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === "Weekly") {
    startDate = new Date(now.setDate(now.getDate() - now.getDay()));
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "Monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startDate, lte: endDate },
    },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });

  const breakdownMap: Record<string, {
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentage: number;
  }> = {};

  let totalSpent = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount);
    totalSpent += amount;

    if (breakdownMap[tx.categoryId]) {
      breakdownMap[tx.categoryId].amount += amount;
    } else {
      breakdownMap[tx.categoryId] = {
        name: tx.category.name,
        icon: tx.category.icon,
        color: tx.category.color,
        amount: amount,
        percentage: 0,
      };
    }
  });

  const breakdown = Object.values(breakdownMap).map((item) => ({
    ...item,
    percentage: totalSpent > 0 ? (item.amount / totalSpent) : 0,
  })).sort((a, b) => b.amount - a.amount);

  const topInsight = breakdown.length > 0 ? breakdown[0] : null;

  return {
    totalSpent: totalSpent.toFixed(2),
    breakdown,
    topInsight: topInsight ? {
      name: topInsight.name,
      icon: topInsight.icon,
      color: topInsight.color,
      percentage: (topInsight.percentage * 100).toFixed(0),
    } : null,
  };
};
