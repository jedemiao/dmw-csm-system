-- CreateTable
CREATE TABLE "SubmissionThrottle" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionThrottle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionThrottle_ipHash_createdAt_idx" ON "SubmissionThrottle"("ipHash", "createdAt");
