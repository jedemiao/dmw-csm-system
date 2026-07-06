export function toReferenceCode(id: string): string {
  return `CSM-${id.slice(-10).toUpperCase()}`;
}
