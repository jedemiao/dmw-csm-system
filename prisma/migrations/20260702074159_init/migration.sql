-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('CITIZEN', 'BUSINESS', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "Cc1" AS ENUM ('AWARE_BEFORE', 'AWARE_ON_SITE', 'NOT_AWARE');

-- CreateEnum
CREATE TYPE "Cc2" AS ENUM ('EASY_TO_FIND', 'HARD_TO_FIND', 'NOT_SEEN');

-- CreateEnum
CREATE TYPE "Cc3" AS ENUM ('USED_CC', 'NOT_USED_CC');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('STAFF', 'ADMIN');

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "Sex" NOT NULL,
    "region" TEXT NOT NULL,
    "agency" TEXT NOT NULL DEFAULT 'Department of Migrant Workers (DMW)',
    "service" TEXT NOT NULL,
    "customerType" "CustomerType" NOT NULL,
    "cc1" "Cc1" NOT NULL,
    "cc2" "Cc2",
    "cc3" "Cc3",
    "cc3Reason" TEXT,
    "sqd1" SMALLINT NOT NULL,
    "sqd2" SMALLINT NOT NULL,
    "sqd3" SMALLINT NOT NULL,
    "sqd4" SMALLINT NOT NULL,
    "sqd5" SMALLINT NOT NULL,
    "sqd6" SMALLINT NOT NULL,
    "sqd7" SMALLINT NOT NULL,
    "sqd8" SMALLINT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveyResponse_createdAt_idx" ON "SurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX "SurveyResponse_region_idx" ON "SurveyResponse"("region");

-- CreateIndex
CREATE INDEX "SurveyResponse_service_idx" ON "SurveyResponse"("service");

-- CreateIndex
CREATE INDEX "SurveyResponse_customerType_idx" ON "SurveyResponse"("customerType");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
