import type { Document } from '../types/document';

/** Soonest expiry first; ties broken by name. */
export function compareDocumentsByExpiry(a: Document, b: Document): number {
  const byDate = a.expiryDate.localeCompare(b.expiryDate);
  if (byDate !== 0) return byDate;
  return a.name.localeCompare(b.name);
}

export function sortDocumentsByExpiry(documents: Document[]): Document[] {
  return [...documents].sort(compareDocumentsByExpiry);
}
