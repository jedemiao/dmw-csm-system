import { z } from "zod";
import { REGIONS } from "@/lib/constants/survey-options";
import { DIVISION_SLUGS, DIVISIONS, SERVICES_BY_DIVISION } from "@/lib/constants/divisions";

const sqdValue = z.enum(["1", "2", "3", "4", "5"]);
const sqdValueWithNA = z.enum(["1", "2", "3", "4", "5", "NA"]);

export const surveyFormSchema = z
  .object({
    age: z.coerce.number().int().gt(0).lt(120),
    sex: z.enum(["female", "male"]),
    region: z.enum(REGIONS),
    division: z.enum(DIVISION_SLUGS),
    service: z.string(),
    customerType: z.enum(["citizen", "business", "government"]),

    cc1: z.enum(["1", "2", "3"]),
    cc2: z.enum(["1", "2", "3"]),
    cc3: z.enum(["1", "2"]),
    cc3Reason: z.string().trim().optional(),

    sqd0: sqdValue,
    sqd1: sqdValue,
    sqd2: sqdValue,
    sqd3: sqdValue,
    sqd4: sqdValue,
    sqd5: sqdValueWithNA,
    sqd6: sqdValue,
    sqd7: sqdValue,
    sqd8: sqdValue,

    remarks: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.cc3 === "2" && !data.cc3Reason) {
      ctx.addIssue({ code: "custom", path: ["cc3Reason"], message: "CC3 reason is required." });
    }

    const division = DIVISIONS.find((d) => d.slug === data.division);
    if (!division || !SERVICES_BY_DIVISION[division.value].includes(data.service)) {
      ctx.addIssue({ code: "custom", path: ["service"], message: "Select a valid service for this division." });
    }
  });

export type SurveyFormInput = z.input<typeof surveyFormSchema>;
export type SurveyFormData = z.output<typeof surveyFormSchema>;
