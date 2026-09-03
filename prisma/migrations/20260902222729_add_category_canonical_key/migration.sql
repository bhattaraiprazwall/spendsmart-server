-- AlterTable
-- Add a canonicalKey column to Category so the ML prediction labels can be
-- mapped to a stable canonical category independent of display names.
ALTER TABLE "Category" ADD COLUMN "canonicalKey" TEXT;

-- Backfill canonicalKey for existing rows. This covers BOTH the current default
-- names (Food/Bills after Step 1) and the previous names (Food & Dining/Utilities)
-- so already-seeded databases map correctly without re-seeding.
UPDATE "Category" SET "canonicalKey" = 'FOOD'          WHERE "name" IN ('Food', 'Food & Dining');
UPDATE "Category" SET "canonicalKey" = 'BILLS'         WHERE "name" IN ('Bills', 'Utilities');
UPDATE "Category" SET "canonicalKey" = 'TRANSPORT'     WHERE "name" = 'Transport';
UPDATE "Category" SET "canonicalKey" = 'SHOPPING'      WHERE "name" = 'Shopping';
UPDATE "Category" SET "canonicalKey" = 'ENTERTAINMENT' WHERE "name" = 'Entertainment';
UPDATE "Category" SET "canonicalKey" = 'HEALTH'        WHERE "name" = 'Health';
UPDATE "Category" SET "canonicalKey" = 'EDUCATION'     WHERE "name" = 'Education';
