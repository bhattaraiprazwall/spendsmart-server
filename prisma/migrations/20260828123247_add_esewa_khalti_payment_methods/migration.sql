-- AlterTable
-- Recreate the PaymentMethod enum: remove UPI, add ESEWA and KHALTI.
-- Since no existing rows use UPI, the change is safe.

ALTER TABLE "Transaction" ALTER COLUMN "paymentMethod" DROP DEFAULT;

CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'ESEWA', 'KHALTI', 'OTHER');

ALTER TABLE "Transaction" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");

DROP TYPE "PaymentMethod";

ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";

ALTER TABLE "Transaction" ALTER COLUMN "paymentMethod" SET DEFAULT 'CARD'::"PaymentMethod";
