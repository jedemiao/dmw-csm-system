import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SERVICES } from "../lib/constants/survey-options";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off script to backfill sample SurveyResponse rows spread across the last
// N calendar months, for testing month/quarter/semester/year report periods.
// Region fixed to Caraga since this deployment only serves that regional office.
const TOTAL_RESPONSES = 200;
const MONTHS_BACK = 12;
const REGION = "Region XIII – Caraga";

const CC1_VALUES = ["AWARE_BEFORE", "AWARE_ON_SITE", "NOT_AWARE"] as const;
const CC2_VALUES = ["EASY_TO_FIND", "HARD_TO_FIND", "NOT_SEEN"] as const;
const CC3_VALUES = ["USED_CC", "NOT_USED_CC"] as const;
const SEX_VALUES = ["FEMALE", "MALE"] as const;
const CUSTOMER_TYPES = ["CITIZEN", "BUSINESS", "GOVERNMENT"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSqd(): number | null {
  if (Math.random() < 0.04) return null;
  const weights = [1, 1, 2, 4, 6];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i + 1;
  }
  return 5;
}

function randomDateInMonth(year: number, monthIndex: number, maxDay?: number, now?: Date): Date {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cap = maxDay ? Math.min(maxDay, daysInMonth) : daysInMonth;
  const day = 1 + Math.floor(Math.random() * cap);
  // When the roll lands on today (the capped boundary of the current-month bucket), the
  // hour/minute must also stay within "so far today" — otherwise this can hand out a
  // createdAt later than the real current time, which poisons the admin notification
  // bell's "seen" cursor into the future the moment that row is clicked (it never sees
  // anything as unread again). Only the day was being capped before, not the time-of-day.
  const isToday = now !== undefined && day === maxDay && day === now.getDate();
  const hour = isToday ? Math.floor(Math.random() * (now.getHours() + 1)) : Math.floor(Math.random() * 24);
  const minute = isToday && hour === now.getHours() ? Math.floor(Math.random() * (now.getMinutes() + 1)) : Math.floor(Math.random() * 60);
  return new Date(year, monthIndex, day, hour, minute);
}

function buildResponse(createdAt: Date) {
  const cc1 = pick(CC1_VALUES);
  const showCc2 = cc1 !== "NOT_AWARE";
  const cc2 = showCc2 ? pick(CC2_VALUES) : undefined;
  const showCc3 = showCc2 && cc2 !== "NOT_SEEN";
  const cc3 = showCc3 ? pick(CC3_VALUES) : undefined;
  const cc3Reason = cc3 === "NOT_USED_CC" ? "Charter did not cover this transaction type." : undefined;

  return {
    age: 18 + Math.floor(Math.random() * 50),
    sex: pick(SEX_VALUES),
    region: REGION,
    service: pick(SERVICES),
    customerType: pick(CUSTOMER_TYPES),
    cc1,
    cc2,
    cc3,
    cc3Reason,
    sqd0: randomSqd(),
    sqd1: randomSqd(),
    sqd2: randomSqd(),
    sqd3: randomSqd(),
    sqd4: randomSqd(),
    sqd5: null,
    sqd6: randomSqd(),
    sqd7: randomSqd(),
    sqd8: randomSqd(),
    remarks: Math.random() < 0.15 ? "Process was smooth overall, thank you." : undefined,
    createdAt,
  };
}

async function main() {
  const now = new Date();
  const perMonth = Math.floor(TOTAL_RESPONSES / MONTHS_BACK);
  const remainder = TOTAL_RESPONSES % MONTHS_BACK;

  const responses = [];
  for (let i = 0; i < MONTHS_BACK; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = perMonth + (i < remainder ? 1 : 0);
    // The current month (i === 0) must not hand out days after today.
    const maxDay = i === 0 ? now.getDate() : undefined;
    for (let j = 0; j < count; j++) {
      responses.push(buildResponse(randomDateInMonth(monthDate.getFullYear(), monthDate.getMonth(), maxDay, now)));
    }
  }

  await prisma.surveyResponse.createMany({ data: responses });
  console.log(`Seeded ${responses.length} sample survey responses for ${REGION} across the last ${MONTHS_BACK} months.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
