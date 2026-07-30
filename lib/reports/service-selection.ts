import { getFlatServices, type Division } from "@/lib/constants/divisions";

// Resolves which of a division's catalog services should appear in a report's
// Summary table, from what staff last saved via the checklist in report-form.tsx.
// An empty/missing saved selection — a brand-new report, or one saved before this
// feature existed — defaults to every catalog service, matching the original
// always-show-everything behavior. A saved selection that no longer matches the
// current catalog (a service was renamed or removed from divisions.ts) is filtered
// down to what still exists; if that empties the list entirely, it falls back to
// "all" rather than silently rendering a blank report.
export function resolveIncludedServices(division: Division, saved: string[] | undefined | null): string[] {
  const allServices = getFlatServices(division);
  // Filter the catalog by the saved set rather than returning the saved array
  // as-is — `saved` comes from a client-side Set (report-form.tsx), so its
  // order reflects whatever sequence checkboxes were toggled in, not the
  // catalog order the report's numbered rows are expected to stay in.
  const savedSet = new Set(saved ?? []);
  const validSaved = allServices.filter((s) => savedSet.has(s));
  return validSaved.length > 0 ? validSaved : allServices;
}
