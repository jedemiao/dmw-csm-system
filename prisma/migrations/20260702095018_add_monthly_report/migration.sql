-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "serviceTransactions" JSONB NOT NULL,
    "improvementPlan" JSONB NOT NULL,
    "summaryAnalysis" TEXT,
    "ccAnalysis" TEXT,
    "sqdAnalysis" TEXT,
    "preparedByName" TEXT,
    "preparedByTitle" TEXT,
    "approvedByName" TEXT,
    "approvedByTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_year_month_key" ON "MonthlyReport"("year", "month");
