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

  const sqd0 = randomSqd();
  const sqd1 = randomSqd();
  const sqd2 = randomSqd();
  const sqd3 = randomSqd();
  const sqd4 = randomSqd();
  const sqd6 = randomSqd();
  const sqd7 = randomSqd();
  const sqd8 = randomSqd();

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
