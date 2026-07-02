-- CreateEnum
CREATE TYPE "ReportPeriodType" AS ENUM ('MONTH', 'QUARTER', 'YEAR');

-- DropTable
DROP TABLE "MonthlyReport";

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
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

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_periodType_year_period_key" ON "Report"("periodType", "year", "period");
