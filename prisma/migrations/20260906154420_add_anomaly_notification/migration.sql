-- CreateTable
CREATE TABLE "AnomalyNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnomalyNotification_userId_idx" ON "AnomalyNotification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnomalyNotification_userId_year_month_key" ON "AnomalyNotification"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "AnomalyNotification" ADD CONSTRAINT "AnomalyNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
