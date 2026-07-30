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
// A tab is a top-level "type of service" branch. Most tabs are terminal — picking
// the tab IS the service, no further breakdown (WRSD: "Welfare and Other Forms of
// Assistance", "AKSYON Fund"). A tab only gets a `catalog` when it needs to drill
// further (WRSD: "Reintegration Services" -> category -> specific service).
export type ServiceTab = { type: string; catalog?: ServiceCatalog };
export type DivisionCatalog = ServiceCatalog | readonly ServiceTab[];

export function isGroupedCatalog(catalog: ServiceCatalog): catalog is readonly ServiceGroup[] {
  return catalog.length > 0 && typeof catalog[0] === "object" && "category" in catalog[0];
}

export function isTabbedCatalog(catalog: DivisionCatalog): catalog is readonly ServiceTab[] {
  return catalog.length > 0 && typeof catalog[0] === "object" && "type" in catalog[0];
}

// Whether a tab needs a further pick (has a non-empty sub-catalog) or is terminal
// (the tab's own name is the service).
export function tabHasCatalog(tab: ServiceTab): boolean {
  return Boolean(tab.catalog && tab.catalog.length > 0);
}

function flattenCatalog(catalog: ServiceCatalog): string[] {
  return isGroupedCatalog(catalog) ? catalog.flatMap((group) => group.services) : [...catalog];
}

export function getFlatServices(division: Division): string[] {
  const catalog = SERVICES_BY_DIVISION[division];
  return isTabbedCatalog(catalog)
    ? catalog.flatMap((tab) => (tabHasCatalog(tab) ? flattenCatalog(tab.catalog!) : [tab.type]))
    : flattenCatalog(catalog);
}

// MWPTD's list reflects its real services. MWPSD's is grouped under head
// service categories, and WRSD is grouped under "type of service" tabs (its
// real catalogs). FAD is a placeholder sample pending its actual service list.
export const SERVICES_BY_DIVISION: Record<Division, DivisionCatalog> = {
  MWPTD: [
    "Provision of Legal Assistance",
    "Extended Other Forms of Assistance",
    "Alternative Dispute Resolution/SENA",
    "Adjudication",
    "Prosecution",
    "Regulation and Licensing",
  ],
  FAD: ["Request for Information Sheet"],
  MWPSD: [
    {
      category: "Documentation and Processing",
      services: ["OEC (Balik-Manggagawa)", "OEC (Direct-Hire)", "OEC Exemption"],
    },
    {
      category: "E-Registration Concerns",
      services: ["Account Creation", "Account Retrieval", "Setting of Appointment"],
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
      category: "Government to Government",
      services: ["Application"],
    },
  ],
  WRSD: [
    {
      type: "Reintegration Services",
      catalog: [
        {
          category: "KABUHAYAN (Employment, Financial Grant/Livelihood)",
          services: [
            "ELPOR: Enhanced Balik Pinay, Balik Hanapbuhay Program (EBPBH)",
            "ELPOR: Expanded Livelihood Development Assistance Program (ELDAP)",
            "SPIMS",
          ],
        },
        {
          category: "KAALAMAN",
          services: [
            "FAS-SBMT",
            "Business Mentoring",
            "Livelihood Skills Training",
            "Byaheng Entrepreneur",
            "Financial Education",
            "Reintegration Education Campaign/Advocacy",
          ],
        },
        {
          category: "KALINGA",
          services: ["Capacity Building for Children of OFW", "Mental Health Awareness & Stress Management Seminar"],
        },
        {
          category: "KUMUSTAHAN",
          services: ["NRN", "CaRENet"],
        },
      ],
    },
    { type: "Welfare and Other Forms of Assistance" },
    { type: "AKSYON Fund" },
  ],
};

export const ALL_SERVICES: readonly string[] = Array.from(
  new Set(Object.keys(SERVICES_BY_DIVISION).flatMap((key) => getFlatServices(key as Division))),
);
