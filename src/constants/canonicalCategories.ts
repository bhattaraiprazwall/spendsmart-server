export const CANONICAL_CATEGORIES = {
  FOOD: "FOOD",
  BILLS: "BILLS",
  TRANSPORT: "TRANSPORT",
  SHOPPING: "SHOPPING",
  ENTERTAINMENT: "ENTERTAINMENT",
  HEALTH: "HEALTH",
  EDUCATION: "EDUCATION",
} as const;

export type CanonicalCategory =
  (typeof CANONICAL_CATEGORIES)[keyof typeof CANONICAL_CATEGORIES];

export const ML_LABEL_TO_CANONICAL: Record<string, string> = {
  Food: "FOOD",
  Bills: "BILLS",
  Transport: "TRANSPORT",
  Shopping: "SHOPPING",
  Entertainment: "ENTERTAINMENT",
  Health: "HEALTH",
  Education: "EDUCATION",
};

export const canonicalKeyFromLabel = (
  label: string,
): string | null =>
  ML_LABEL_TO_CANONICAL[label] ?? null;
