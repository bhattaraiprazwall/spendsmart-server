import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

interface CategoryLimit {
  categoryId: string;
  limit: number;
}

const getMonthRange = (year: number, month: number) => {
  return {
    startOfMonth: new Date(year, month - 1, 1),
    endOfMonth: new Date(year, month, 0, 23, 59, 59, 999),
  };
};

const categorySelect = {
  select: { id: true, name: true, icon: true, color: true },
} as const;

const budgetInclude = {
  budgetCategories: {
    include: { category: categorySelect },
  },
} as const;

export const getBudget = async (
  userId: string,
  month: number,
  year: number,
) => {
  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: budgetInclude,
  });
  return budget;
};

export const createOrUpdateBudget = async (
  userId: string,
  data: {
    month: number;
    year: number;
    totalAmount: number;
    categories?: CategoryLimit[];
  },
) => {
  const { month, year, totalAmount, categories } = data;

  if (categories?.length) {
    const categoryIds = categories.map((c) => c.categoryId);
    const found = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        type: "EXPENSE",
        OR: [{ isDefault: true }, { userId }],
      },
      select: { id: true },
    });
    const foundIds = new Set(found.map((f) => f.id));
    for (const c of categories) {
      if (!foundIds.has(c.categoryId)) {
        throw new Error(
          `Category "${c.categoryId}" not found or is not an expense category`,
        );
      }
    }
  }

  const budget = await prisma.$transaction(async (tx) => {
    const b = await tx.budget.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: {
        userId,
        month,
        year,
        totalAmount: new Prisma.Decimal(totalAmount),
      },
      update: { totalAmount: new Prisma.Decimal(totalAmount) },
    });

    if (categories?.length) {
      const existing = await tx.budgetCategory.findMany({
        where: { budgetId: b.id },
        select: { categoryId: true },
      });
      const existingSet = new Set(existing.map((e) => e.categoryId));

      for (const c of categories) {
        if (existingSet.has(c.categoryId)) {
          await tx.budgetCategory.update({
            where: {
              budgetId_categoryId: { budgetId: b.id, categoryId: c.categoryId },
            },
            data: { limit: new Prisma.Decimal(c.limit) },
          });
        } else {
          await tx.budgetCategory.create({
            data: {
              budgetId: b.id,
              categoryId: c.categoryId,
              limit: new Prisma.Decimal(c.limit),
            },
          });
        }
      }
    }

    return tx.budget.findUnique({
      where: { id: b.id },
      include: budgetInclude,
    });
  });

  return budget;
};

export const updateBudget = async (
  id: string,
  userId: string,
  data: { totalAmount: number },
) => {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Budget not found");

  return prisma.budget.update({
    where: { id },
    data: { totalAmount: new Prisma.Decimal(data.totalAmount) },
    include: budgetInclude,
  });
};

export const deleteBudget = async (id: string, userId: string) => {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Budget not found");

  await prisma.budget.delete({ where: { id } });
};

export const setBudgetCategory = async (
  budgetId: string,
  userId: string,
  data: CategoryLimit,
) => {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });
  if (!budget) throw new Error("Budget not found");

  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      type: "EXPENSE",
      OR: [{ isDefault: true }, { userId }],
    },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found or is not an expense category");

  return prisma.budgetCategory.upsert({
    where: {
      budgetId_categoryId: { budgetId, categoryId: data.categoryId },
    },
    create: {
      budgetId,
      categoryId: data.categoryId,
      limit: new Prisma.Decimal(data.limit),
    },
    update: { limit: new Prisma.Decimal(data.limit) },
    include: { category: categorySelect },
  });
};

export const updateBudgetCategory = async (
  budgetId: string,
  categoryId: string,
  userId: string,
  data: { limit: number },
) => {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });
  if (!budget) throw new Error("Budget not found");

  const budgetCategory = await prisma.budgetCategory.findUnique({
    where: { budgetId_categoryId: { budgetId, categoryId } },
  });
  if (!budgetCategory) throw new Error("Budget category not found");

  return prisma.budgetCategory.update({
    where: { id: budgetCategory.id },
    data: { limit: new Prisma.Decimal(data.limit) },
    include: { category: categorySelect },
  });
};

export const removeBudgetCategory = async (
  budgetId: string,
  categoryId: string,
  userId: string,
) => {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });
  if (!budget) throw new Error("Budget not found");

  const budgetCategory = await prisma.budgetCategory.findUnique({
    where: { budgetId_categoryId: { budgetId, categoryId } },
  });
  if (!budgetCategory) throw new Error("Budget category not found");

  await prisma.budgetCategory.delete({ where: { id: budgetCategory.id } });
};

export const getBudgetStatus = async (id: string, userId: string) => {
  const budget = await prisma.budget.findFirst({
    where: { id, userId },
    include: budgetInclude,
  });
  if (!budget) throw new Error("Budget not found");

  const { startOfMonth, endOfMonth } = getMonthRange(budget.year, budget.month);
  const dateRange = { gte: startOfMonth, lte: endOfMonth };

  const [totalResult, byCategory, user] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: dateRange },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: dateRange },
      _sum: { amount: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { budgetAlertThreshold: true },
    }),
  ]);

  const totalSpent = Number(totalResult._sum.amount ?? 0);
  const totalAmount = Number(budget.totalAmount);
  const remaining = totalAmount - totalSpent;
  const usagePercentage =
    totalAmount > 0 ? Math.round((totalSpent / totalAmount) * 100) : 0;
  const isOverspent = totalSpent > totalAmount;
  const threshold = user?.budgetAlertThreshold ?? 80;
  const status =
    usagePercentage >= 100
      ? "EXCEEDED"
      : usagePercentage >= threshold
        ? "WARNING"
        : "OK";

  const spentMap = new Map(
    byCategory.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]),
  );

  const categories = budget.budgetCategories.map((bc) => {
    const spent = spentMap.get(bc.categoryId) ?? 0;
    const limit = Number(bc.limit);
    const catRemaining = limit - spent;
    const catUsage =
      limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const catStatus =
      catUsage >= 100
        ? "EXCEEDED"
        : catUsage >= threshold
          ? "WARNING"
          : "OK";

    return {
      category: bc.category,
      limit: limit.toFixed(2),
      spent: spent.toFixed(2),
      remaining: catRemaining.toFixed(2),
      usagePercentage: catUsage,
      isOverspent: spent > limit,
      status: catStatus,
    };
  });

  return {
    budget: {
      id: budget.id,
      month: budget.month,
      year: budget.year,
      totalAmount: totalAmount.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      remaining: remaining.toFixed(2),
      usagePercentage,
      isOverspent,
      status,
    },
    categories,
  };
};

export const checkOverspending = async (
  userId: string,
  categoryId: string,
  month: number,
  year: number,
) => {
  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: { budgetCategories: true },
  });
  if (!budget) return null;

  const categoryBudget = budget.budgetCategories.find(
    (bc) => bc.categoryId === categoryId,
  );
  if (!categoryBudget) return null;

  const { startOfMonth, endOfMonth } = getMonthRange(year, month);
  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  const spent = Number(result._sum.amount ?? 0);
  const limit = Number(categoryBudget.limit);
  const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;
  const roundedUsage = Math.round(usagePercent * 100) / 100;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const threshold = user?.budgetAlertThreshold ?? 80;

  if (roundedUsage >= 100) {
    return { type: "BUDGET_EXCEEDED", spent, limit, usagePercent: roundedUsage };
  }
  if (roundedUsage >= threshold) {
    return { type: "BUDGET_WARNING", spent, limit, usagePercent: roundedUsage };
  }

  return null;
};