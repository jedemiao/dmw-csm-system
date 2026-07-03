import { z } from "zod";
import { REGIONS, SERVICES } from "@/lib/constants/survey-options";

const sqdValue = z.enum(["1", "2", "3", "4", "5", "NA"]);

export const surveyFormSchema = z
  .object({
    age: z.coerce.number().int().gt(0).lt(120),
    sex: z.enum(["female", "male"]),
    region: z.enum(REGIONS),
    service: z.enum(SERVICES),
    customerType: z.enum(["citizen", "business", "government"]),

    cc1: z.enum(["1", "2", "3"]),
    cc2: z.enum(["1", "2", "3"]).optional(),
    cc3: z.enum(["1", "2"]).optional(),
    cc3Reason: z.string().trim().optional(),

    sqd1: sqdValue,
    sqd2: sqdValue,
    sqd3: sqdValue,
    sqd4: sqdValue,
    sqd5: sqdValue,
    sqd6: sqdValue,
    sqd7: sqdValue,
    sqd8: sqdValue,

    remarks: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const showCc2 = data.cc1 === "1" || data.cc1 === "2";
    const showCc3 = showCc2 && (data.cc2 === "1" || data.cc2 === "2");
    const showCc3Reason = showCc3 && data.cc3 === "2";

    if (showCc2 && !data.cc2) {
      ctx.addIssue({ code: "custom", path: ["cc2"], message: "CC2 is required." });
    }
    if (showCc3 && !data.cc3) {
      ctx.addIssue({ code: "custom", path: ["cc3"], message: "CC3 is required." });
    }
    if (showCc3Reason && !data.cc3Reason) {
      ctx.addIssue({ code: "custom", path: ["cc3Reason"], message: "CC3 reason is required." });
    }
  });

export type SurveyFormInput = z.input<typeof surveyFormSchema>;
export type SurveyFormData = z.output<typeof surveyFormSchema>;
