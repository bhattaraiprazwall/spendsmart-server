import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(50),
  icon: z.string().trim().min(1, "Icon is required"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #FF6B6B"),
  type: z.enum(["EXPENSE", "INCOME"]).default("EXPENSE"),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  icon: z.string().trim().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: z.enum(["EXPENSE", "INCOME"]).optional(),
});
