import { prisma } from "../lib/prisma.js";
import { predictCategoryMNB } from "./prediction.service.js";

export const getCategories = async (
  userId: string,
  type?: "EXPENSE" | "INCOME",
) => {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { isDefault: true },
        { userId },
      ],
      ...(type ? { type } : {}),
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return categories;
};

export const createCategory = async (
  userId: string,
  data: { name: string; icon: string; color: string; type: "EXPENSE" | "INCOME" },
) => {
  const existing = await prisma.category.findFirst({
    where: {
      name: data.name,
      type: data.type,
      OR: [{ isDefault: true }, { userId }],
    },
  });
  if (existing) {
    throw new Error(`Category "${data.name}" already exists`);
  }

  const category = await prisma.category.create({
    data: { ...data, userId, isDefault: false },
  });
  return category;
};

export const updateCategory = async (
  categoryId: string,
  userId: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
    type?: "EXPENSE" | "INCOME";
  },
) => {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!existing) {
    throw new Error("Category not found or not editable");
  }

  if (data.type && data.type !== existing.type) {
    const transactionCount = await prisma.transaction.count({
      where: { categoryId },
    });
    if (transactionCount > 0) {
      throw new Error(
        "Cannot change type of a category that already has transactions",
      );
    }
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
  });
  return category;
};

export const deleteCategory = async (categoryId: string, userId: string) => {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!existing) {
    throw new Error("Category not found or cannot be deleted");
  }

  await prisma.category.delete({ where: { id: categoryId } });
};

export const predictCategory = async (
  title: string,
  userId: string,
  type?: "EXPENSE" | "INCOME",
) => {
  const mnbResult = await predictCategoryMNB(title, userId, type);

  if (mnbResult.predictedCategory && mnbResult.confidence >= 0.3) {
    return mnbResult;
  }

  const titleLower = title.toLowerCase();
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ isDefault: true }, { userId }],
      ...(type ? { type } : {}),
    },
    include: { keywords: true },
  });

  let bestMatch = null;
  let bestScore = 0;

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (titleLower.includes(kw.keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return {
    predictedCategory: bestMatch
      ? {
          id: bestMatch.id,
          name: bestMatch.name,
          icon: bestMatch.icon,
          color: bestMatch.color,
        }
      : null,
    confidence: bestScore > 0 ? Math.min(bestScore * 0.3, 1.0) : 0,
  };
};
