import { prisma } from "../lib/prisma.js";
import { canonicalKeyFromLabel } from "../constants/canonicalCategories.js";

export interface ResolvedCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  canonicalKey: string | null;
}

/**
 * Resolve an ML prediction label (e.g. "Food") to the user's actual category
 * via the canonical key. A user's own custom category mapped to the same
 * canonical key is preferred; otherwise the system default is used.
 */
export const resolveCategoryByLabel = async (
  userId: string,
  label: string,
): Promise<ResolvedCategory | null> => {
  const canonicalKey = canonicalKeyFromLabel(label);
  if (!canonicalKey) return null;

  return resolveCategoryByCanonical(userId, canonicalKey);
};

export const resolveCategoryByCanonical = async (
  userId: string,
  canonicalKey: string,
): Promise<ResolvedCategory | null> => {
  const categories = await prisma.category.findMany({
    where: {
      canonicalKey,
      type: "EXPENSE",
      OR: [{ userId }, { isDefault: true }],
    },
    orderBy: [{ isDefault: "asc" }],
    take: 1,
  });

  const category = categories[0];
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    canonicalKey: category.canonicalKey,
  };
};
