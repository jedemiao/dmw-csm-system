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

export type ServiceGroup = { category: string; services: readonly string[] };
export type ServiceCatalog = readonly string[] | readonly ServiceGroup[];

export function isGroupedCatalog(catalog: ServiceCatalog): catalog is readonly ServiceGroup[] {
  return catalog.length > 0 && typeof catalog[0] !== "string";
}

export function getFlatServices(division: Division): string[] {
  const catalog = SERVICES_BY_DIVISION[division];
  return isGroupedCatalog(catalog) ? catalog.flatMap((group) => group.services) : [...catalog];
}

// MWPTD's list reflects its real services. MWPSD's is grouped under head
// service categories (its real catalog). FAD and WRSD are placeholder
// samples pending the actual per-division service lists.
export const SERVICES_BY_DIVISION: Record<Division, ServiceCatalog> = {
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
    {
      category: "Documentation and Processing",
      services: ["OEC (Balik-Manggagawa)", "OEC (Direct-Hire)"],
    },
    {
      category: "E-Registration Concerns",
      services: ["Account Creation", "Account Retrieval", "OEC Exemption", "Setting of Appointment"],
    },
    {
      category: "Balik-Manggagawa Concerns",
      services: ["OEC Cancellation", "Transfer of OLD Records"],
    },
    {
      category: "Deployment Record",
      services: ["Input of Deployment Record"],
    },
    {
      category: "Information Sheet",
      services: ["Request for Info Sheet"],
    },
  ],
  WRSD: [
    "Repatriation Assistance",
    "Welfare Case Management",
    "Reintegration Program Enrollment",
  ],
};

export const ALL_SERVICES: readonly string[] = Array.from(
  new Set(Object.keys(SERVICES_BY_DIVISION).flatMap((key) => getFlatServices(key as Division))),
);
