import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { REGIONS } from "../lib/constants/survey-options";
import { DIVISIONS, SERVICES_BY_DIVISION } from "../lib/constants/divisions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CC1_VALUES = ["AWARE_BEFORE", "AWARE_ON_SITE", "NOT_AWARE"] as const;
const CC2_VALUES = ["EASY_TO_FIND", "HARD_TO_FIND", "NOT_SEEN"] as const;
const CC3_VALUES = ["USED_CC", "NOT_USED_CC"] as const;
const SEX_VALUES = ["FEMALE", "MALE"] as const;
const CUSTOMER_TYPES = ["CITIZEN", "BUSINESS", "GOVERNMENT"] as const;

// Remark pools, picked to match how positively the response actually rated the
// transaction — a low-scoring response shouldn't get a glowing thank-you remark.
const POSITIVE_REMARKS = [
  "Napakabilis at maayos ng serbisyo, salamat po!",
  "Very satisfied with how the staff handled my transaction.",
  "Great service, the staff were very accommodating.",
  "Thank you for the excellent assistance today.",
  "Mabait at propesyonal ang mga tauhan. Keep it up!",
  "Smooth and hassle-free transaction. Well done.",
  "I appreciate how quickly my concern was addressed.",
  "Salamat po sa mabilis at maayos na serbisyo!",
];
const NEUTRAL_REMARKS = [
  "Okay naman ang serbisyo pero medyo matagal ang pila.",
  "Please add more staff during peak hours.",
  "Sana mas mapabilis pa ang proseso ng requirements.",
  "The service was fine overall, just a bit slow.",
  "Maybe an online tracking system would help.",
  "Information about requirements could be clearer.",
  "Konting improvement na lang sa waiting time, ok na.",
];
const NEGATIVE_REMARKS = [
  "Ang tagal ng pila, sana mapabilis pa ang serbisyo.",
  "Staff could be more attentive to clients' concerns.",
  "Hindi masyadong malinaw ang mga requirements na hiningi sa akin.",
  "Had to wait a long time without clear updates.",
  "Medyo nakaka-disappoint ang naging proseso ko.",
  "Please improve the waiting time for transactions.",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Most respondents leave remarks blank; when one is left, its tone follows the
// average of that response's own SQD ratings rather than being picked independently.
function buildRemark(sqdValues: Array<number | null>): string | undefined {
  if (Math.random() >= 0.4) return undefined;
  const answered = sqdValues.filter((v): v is number => v !== null);
  if (answered.length === 0) return undefined;
  const avg = answered.reduce((a, b) => a + b, 0) / answered.length;
  if (avg >= 4.3) return pick(POSITIVE_REMARKS);
  if (avg >= 3.2) return pick(NEUTRAL_REMARKS);
  return pick(NEGATIVE_REMARKS);
}

function randomSqd(): number | null {
  // A small share of answers are N/A (e.g. cost doesn't apply to a free service).
  if (Math.random() < 0.04) return null;
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
  const username = "admin";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username } });

  if (existingAdmin) {
    console.log(`Admin user "${username}" already exists, leaving password untouched.`);
  } else {
    const initialPassword = process.env.SEED_ADMIN_PASSWORD ?? crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(initialPassword, 12);

    await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        name: "Client Satisfaction Measurement",
        role: "ADMIN",
        division: null,
      },
    });

    if (process.env.SEED_ADMIN_PASSWORD) {
      console.log(`Seeded admin user: ${username} (password taken from SEED_ADMIN_PASSWORD)`);
    } else {
      console.log(
        `Seeded admin user: ${username} / ${initialPassword} (generated — save this now, it will not be shown again; change it after first login)`,
      );
    }
  }

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

    const sqd0 = randomSqd();
    const sqd1 = randomSqd();
    const sqd2 = randomSqd();
    const sqd3 = randomSqd();
    const sqd4 = randomSqd();
    const sqd6 = randomSqd();
    const sqd7 = randomSqd();
    const sqd8 = randomSqd();

    const division = pick(DIVISIONS).value;

    return {
      age: 18 + Math.floor(Math.random() * 50),
      sex: pick(SEX_VALUES),
      region: pick(REGIONS),
      division,
      service: pick(SERVICES_BY_DIVISION[division]),
      customerType: pick(CUSTOMER_TYPES),
      cc1,
      cc2,
      cc3,
      cc3Reason,
      sqd0,
      sqd1,
      sqd2,
      sqd3,
      sqd4,
      sqd5: null,
      sqd6,
      sqd7,
      sqd8,
      remarks: buildRemark([sqd0, sqd1, sqd2, sqd3, sqd4, sqd6, sqd7, sqd8]),
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
