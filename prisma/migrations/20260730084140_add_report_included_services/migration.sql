-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "includedServices" TEXT[] DEFAULT ARRAY[]::TEXT[];
