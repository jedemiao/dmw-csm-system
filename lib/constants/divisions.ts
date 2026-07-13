export const DIVISIONS = [
  { value: "FAD", slug: "fad", label: "Finance and Administrative Division (FAD)", shortLabel: "FAD" },
  { value: "MWPTD", slug: "mwptd", label: "Migrant Workers Protection Division (MWPtD)", shortLabel: "MWPtD" },
  { value: "MWPSD", slug: "mwpsd", label: "Migrant Workers Processing Division (MWPsD)", shortLabel: "MWPsD" },
  { value: "WRSD", slug: "wrsd", label: "Welfare and Reintegration Services Division (WRSD)", shortLabel: "WRSD" },
] as const;

export type Division = (typeof DIVISIONS)[number]["value"];
export type DivisionSlug = (typeof DIVISIONS)[number]["slug"];
export type DivisionMeta = (typeof DIVISIONS)[number];

export const DIVISION_SLUGS = DIVISIONS.map((d) => d.slug) as [DivisionSlug, ...DivisionSlug[]];

export function getDivisionBySlug(slug: string) {
  return DIVISIONS.find((d) => d.slug === slug);
}

export function getDivisionLabel(value: Division): string {
  return DIVISIONS.find((d) => d.value === value)?.label ?? value;
}

export function getDivisionShortLabel(value: Division): string {
  return DIVISIONS.find((d) => d.value === value)?.shortLabel ?? value;
}

// MWPTD's list reflects its real services. The other three are placeholder
// samples pending the actual per-division service lists.
export const SERVICES_BY_DIVISION: Record<Division, readonly string[]> = {
  MWPTD: [
    "Provision of Legal Assistance",
    "Extended Other Forms of Assistance",
    "Alternative Dispute Resolution/SENA",
    "Adjudication",
    "Prosecution",
    "Regulation and Licensing",
  ],
  FAD: [
    "Payroll and Compensation Processing",
    "Procurement and Supply Management",
    "Budget and Financial Reporting",
  ],
  MWPSD: [
    "Overseas Employment Certificate (OEC) Processing",
    "Contract Verification and Processing",
    "Registration and Accreditation",
  ],
  WRSD: [
    "Repatriation Assistance",
    "Welfare Case Management",
    "Reintegration Program Enrollment",
  ],
};

export const ALL_SERVICES: readonly string[] = Array.from(
  new Set(Object.values(SERVICES_BY_DIVISION).flat()),
);
