export type DocumentCategoryId =
  | 'passport'
  | 'visa'
  | 'drivers_license'
  | 'insurance'
  | 'residence_permit'
  | 'id_card'
  | 'other';

export type Document = {
  id: string;
  /** Preset category for icon and filtering; see `DocumentCategoryId`. */
  category: DocumentCategoryId;
  /** Free-form name or type, e.g. "Mom's passport" or "Schengen visa". */
  name: string;
  /** Person the document belongs to. */
  holder: string;
  /** ISO `YYYY-MM-DD`, or `null` if not set. */
  issueDate: string | null;
  /** ISO `YYYY-MM-DD` — expiry. */
  expiryDate: string;
  comments: string;
};
