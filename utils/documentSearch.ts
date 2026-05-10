import i18n from '../i18n';
import type { Document } from '../types/document';

/** Case-insensitive substring match on name, holder, category id, or localized category label. */
export function documentMatchesSearch(doc: Document, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  if (doc.name.toLowerCase().includes(q)) return true;
  if (doc.holder.trim().toLowerCase().includes(q)) return true;
  if (doc.category.toLowerCase().includes(q)) return true;
  const label = String(i18n.t(`categories.${doc.category}`)).toLowerCase();
  if (label.includes(q)) return true;
  return false;
}
