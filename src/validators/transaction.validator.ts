import { z } from "zod";

export const createTransactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]).default("EXPENSE"),
  amount: z.number().positive("Amount must be positive"),
  title: z.string().min(1, "Title is required"),
  note: z.string().optional(),
  paymentMethod: z
    .enum(["CASH", "CARD", "BANK_TRANSFER", "ESEWA", "KHALTI", "OTHER"])
    .default("CARD"),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  categoryId: z.string().uuid("Invalid category ID"),
});

export const updateTransactionSchema = createTransactionSchema.partial();
