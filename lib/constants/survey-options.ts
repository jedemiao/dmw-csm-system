export const REGIONS = [
  "NCR – National Capital Region",
  "CAR – Cordillera Administrative Region",
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
  "Outside the Philippines",
] as const;

export const DEFAULT_AGENCY = "Department of Migrant Workers - RO XIII (Caraga)";

export const SQD_ITEMS = [
  { name: "sqd0", qKey: "sqd0_q", dimKey: "sqd0_dim", allowsNA: false },
  { name: "sqd1", qKey: "sqd1_q", dimKey: "sqd1_dim", allowsNA: false },
  { name: "sqd2", qKey: "sqd2_q", dimKey: "sqd2_dim", allowsNA: false },
  { name: "sqd3", qKey: "sqd3_q", dimKey: "sqd3_dim", allowsNA: false },
  { name: "sqd4", qKey: "sqd4_q", dimKey: "sqd4_dim", allowsNA: false },
  { name: "sqd5", qKey: "sqd5_q", dimKey: "sqd5_dim", allowsNA: true },
  { name: "sqd6", qKey: "sqd6_q", dimKey: "sqd6_dim", allowsNA: false },
  { name: "sqd7", qKey: "sqd7_q", dimKey: "sqd7_dim", allowsNA: false },
  { name: "sqd8", qKey: "sqd8_q", dimKey: "sqd8_dim", allowsNA: false },
] as const;

export const SCALE_OPTIONS = [
  { value: "1", scaleKey: "scale_sd", vhKey: "vh_sd", emoji: "😢" },
  { value: "2", scaleKey: "scale_d", vhKey: "vh_d", emoji: "🙁" },
  { value: "3", scaleKey: "scale_n", vhKey: "vh_n", emoji: "😐" },
  { value: "4", scaleKey: "scale_a", vhKey: "vh_a", emoji: "🙂" },
  { value: "5", scaleKey: "scale_sa", vhKey: "vh_sa", emoji: "😀" },
  { value: "NA", scaleKey: "scale_na", vhKey: "vh_na", emoji: "➖" },
] as const;
