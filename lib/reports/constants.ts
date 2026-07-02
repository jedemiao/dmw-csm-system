export const OFFICE_NAME = "DEPARTMENT OF MIGRANT WORKERS REGIONAL OFFICE XIII-CARAGA";
export const OFFICE_ADDRESS = "Nimfa Tiu Bldg. 7, J. Rosales Avenue, Butuan City, Agusan del Norte, 8600";
export const OFFICE_WEBSITE = "www.dmw.gov.ph";
export const OFFICE_EMAIL = "butuan@dmw.gov.ph";
export const OFFICE_PHONE = "(085)815-1708";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Report demographic order follows the ARTA CSM report template.
export const REPORT_REGION_ORDER = [
  "Region I – Ilocos Region",
  "Region II – Cagayan Valley",
  "Region III – Central Luzon",
  "Region IV-A – CALABARZON",
  "MIMAROPA Region",
  "Region V – Bicol Region",
  "Region VI – Western Visayas",
  "Region VII – Central Visayas",
  "Region VIII – Eastern Visayas",
  "Region IX – Zamboanga Peninsula",
  "Region X – Northern Mindanao",
  "Region XI – Davao Region",
  "Region XII – SOCCSKSARGEN",
  "Region XIII – Caraga",
  "BARMM – Bangsamoro Autonomous Region",
  "CAR – Cordillera Administrative Region",
  "NCR – National Capital Region",
  "Outside the Philippines",
] as const;

export const AGE_BUCKETS = [
  { label: "19 and below", min: 0, max: 19 },
  { label: "20-34 years old", min: 20, max: 34 },
  { label: "35-49", min: 35, max: 49 },
  { label: "50-64", min: 50, max: 64 },
  { label: "65 and higher", min: 65, max: Infinity },
] as const;
