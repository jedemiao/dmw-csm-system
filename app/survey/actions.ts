"use server";

import { prisma } from "@/lib/db";
import { surveyFormSchema } from "@/lib/validation/survey-schema";

const SEX_MAP = { female: "FEMALE", male: "MALE" } as const;
const CUSTOMER_TYPE_MAP = { citizen: "CITIZEN", business: "BUSINESS", government: "GOVERNMENT" } as const;
const CC1_MAP = { "1": "AWARE_BEFORE", "2": "AWARE_ON_SITE", "3": "NOT_AWARE" } as const;
const CC2_MAP = { "1": "EASY_TO_FIND", "2": "HARD_TO_FIND", "3": "NOT_SEEN" } as const;
const CC3_MAP = { "1": "USED_CC", "2": "NOT_USED_CC" } as const;

export async function submitSurvey(input: unknown): Promise<{ id: string }> {
  const data = surveyFormSchema.parse(input);

  const response = await prisma.surveyResponse.create({
    data: {
      age: data.age,
      sex: SEX_MAP[data.sex],
      region: data.region,
      service: data.service,
      customerType: CUSTOMER_TYPE_MAP[data.customerType],
      cc1: CC1_MAP[data.cc1],
      cc2: data.cc2 ? CC2_MAP[data.cc2] : undefined,
      cc3: data.cc3 ? CC3_MAP[data.cc3] : undefined,
      cc3Reason: data.cc3Reason || undefined,
      sqd1: Number(data.sqd1),
      sqd2: Number(data.sqd2),
      sqd3: Number(data.sqd3),
      sqd4: Number(data.sqd4),
      sqd5: Number(data.sqd5),
      sqd6: Number(data.sqd6),
      sqd7: Number(data.sqd7),
      sqd8: Number(data.sqd8),
      remarks: data.remarks || undefined,
    },
    select: { id: true },
  });

  return response;
}
