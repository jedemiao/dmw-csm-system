/*
  Warnings:

  - Replaces the single `service` column with a `services` array so a response can
    record more than one transaction/service in one visit. Existing rows are
    backfilled into a one-element array so no data is lost.

*/
-- DropIndex
DROP INDEX "SurveyResponse_service_idx";

-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: carry each existing single service into the new array column.
UPDATE "SurveyResponse" SET "services" = ARRAY["service"]::TEXT[];

ALTER TABLE "SurveyResponse" ALTER COLUMN "services" DROP DEFAULT;
ALTER TABLE "SurveyResponse" DROP COLUMN "service";

-- CreateIndex
CREATE INDEX "SurveyResponse_services_idx" ON "SurveyResponse" USING GIN ("services");
