import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { REGIONS, SERVICES } from "../lib/constants/survey-options";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CC1_VALUES = ["AWARE_BEFORE", "AWARE_ON_SITE", "NOT_AWARE"] as const;
const CC2_VALUES = ["EASY_TO_FIND", "HARD_TO_FIND", "NOT_SEEN"] as const;
const CC3_VALUES = ["USED_CC", "NOT_USED_CC"] as const;
const SEX_VALUES = ["FEMALE", "MALE"] as const;
const CUSTOMER_TYPES = ["CITIZEN", "BUSINESS", "GOVERNMENT"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSqd(): number {
  // Skew toward positive ratings, like a typical CSM dataset.
  const weights = [1, 1, 2, 4, 6];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i + 1;
  }
  return 5;
}

async function main() {
  const email = "admin@dmw.gov.ph";
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "DMW CSM Administrator",
      role: "ADMIN",
    },
  });
  console.log(`Seeded admin user: ${email} / ChangeMe123! (change this immediately in non-dev environments)`);

  const existingCount = await prisma.surveyResponse.count();
  if (existingCount > 0) {
    console.log(`SurveyResponse already has ${existingCount} rows, skipping sample data.`);
    return;
  }

  const now = Date.now();
  const sampleResponses = Array.from({ length: 120 }, (_, i) => {
    const cc1 = pick(CC1_VALUES);
    const showCc2 = cc1 !== "NOT_AWARE";
    const cc2 = showCc2 ? pick(CC2_VALUES) : undefined;
    const showCc3 = showCc2 && cc2 !== "NOT_SEEN";
    const cc3 = showCc3 ? pick(CC3_VALUES) : undefined;
    const cc3Reason = cc3 === "NOT_USED_CC" ? "Charter did not cover this transaction type." : undefined;
    const daysAgo = Math.floor((i / 120) * 90);

    return {
      age: 18 + Math.floor(Math.random() * 50),
      sex: pick(SEX_VALUES),
      region: pick(REGIONS),
      service: pick(SERVICES),
      customerType: pick(CUSTOMER_TYPES),
      cc1,
      cc2,
      cc3,
      cc3Reason,
      sqd1: randomSqd(),
      sqd2: randomSqd(),
      sqd3: randomSqd(),
      sqd4: randomSqd(),
      sqd5: randomSqd(),
      sqd6: randomSqd(),
      sqd7: randomSqd(),
      sqd8: randomSqd(),
      remarks: i % 7 === 0 ? "Process was smooth overall, thank you." : undefined,
      createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
    };
  });

  await prisma.surveyResponse.createMany({ data: sampleResponses });
  console.log(`Seeded ${sampleResponses.length} sample survey responses.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
