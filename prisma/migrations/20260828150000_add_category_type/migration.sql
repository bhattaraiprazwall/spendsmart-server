-- AlterTable
-- Add a type column (EXPENSE | INCOME) to Category so categories are split
-- by transaction type. Existing rows default to EXPENSE; backfill the
-- seeded income categories to INCOME.

ALTER TABLE "Category" ADD COLUMN "type" "TransactionType" NOT NULL DEFAULT 'EXPENSE';

UPDATE "Category" SET "type" = 'INCOME' WHERE "name" IN ('Salary', 'Freelance');