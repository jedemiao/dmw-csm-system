-- CreateEnum
CREATE TYPE "Division" AS ENUM ('FAD', 'MWPTD', 'MWPSD', 'WRSD');

-- AlterTable: SurveyResponse
-- Added nullable first so existing rows can be backfilled before the NOT NULL
-- constraint is applied; all pre-existing responses were collected under what
-- is now known to be the Migrant Workers Protection Division (MWPTD).
ALTER TABLE "SurveyResponse" ADD COLUMN "division" "Division";
UPDATE "SurveyResponse" SET "division" = 'MWPTD' WHERE "division" IS NULL;
ALTER TABLE "SurveyResponse" ALTER COLUMN "division" SET NOT NULL;
CREATE INDEX "SurveyResponse_division_idx" ON "SurveyResponse"("division");

-- AlterTable: AdminUser
-- Stays nullable: NULL means an oversight admin who sees/manages all divisions.
-- Existing admin accounts default to NULL (oversight), preserving their current
-- full access rather than silently scoping them to one division.
ALTER TABLE "AdminUser" ADD COLUMN "division" "Division";

-- AlterTable: Report
ALTER TABLE "Report" ADD COLUMN "division" "Division";
UPDATE "Report" SET "division" = 'MWPTD' WHERE "division" IS NULL;
ALTER TABLE "Report" ALTER COLUMN "division" SET NOT NULL;
DROP INDEX "Report_periodType_year_period_key";
CREATE UNIQUE INDEX "Report_periodType_year_period_division_key" ON "Report"("periodType", "year", "period", "division");

-- AlterTable: ReportDownload
ALTER TABLE "ReportDownload" ADD COLUMN "division" "Division";
UPDATE "ReportDownload" SET "division" = 'MWPTD' WHERE "division" IS NULL;
ALTER TABLE "ReportDownload" ALTER COLUMN "division" SET NOT NULL;
