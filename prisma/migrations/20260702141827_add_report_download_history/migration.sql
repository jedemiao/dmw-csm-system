-- CreateTable
CREATE TABLE "ReportDownload" (
    "id" TEXT NOT NULL,
    "periodType" "ReportPeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "downloadedByName" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportDownload_downloadedAt_idx" ON "ReportDownload"("downloadedAt");
