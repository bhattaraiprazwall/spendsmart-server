import { z } from "zod";

export const createBudgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1970).max(9999),
  totalAmount: z.number().positive("Total amount must be positive"),
  categories: z
    .array(
      z
        .object({
          categoryId: z.string().uuid("Invalid category ID"),
          limit: z.number().positive("Limit must be positive"),
        })
        .strict(),
    )
    .optional(),
});

export const updateBudgetSchema = z
  .object({
    totalAmount: z.number().positive("Total amount must be positive"),
  })
  .strict();

export const setBudgetCategorySchema = z
  .object({
    categoryId: z.string().uuid("Invalid category ID"),
    limit: z.number().positive("Limit must be positive"),
  })
  .strict();

export const updateBudgetCategorySchema = z
  .object({
    limit: z.number().positive("Limit must be positive"),
  })
  .strict();