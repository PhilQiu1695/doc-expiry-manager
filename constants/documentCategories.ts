import type { DocumentCategoryId } from '../types/document';

export const DOCUMENT_CATEGORY_IDS: DocumentCategoryId[] = [
  'passport',
  'visa',
  'drivers_license',
  'insurance',
  'residence_permit',
  'id_card',
  'other',
];

export function isDocumentCategoryId(v: string): v is DocumentCategoryId {
  return (DOCUMENT_CATEGORY_IDS as string[]).includes(v);
}
