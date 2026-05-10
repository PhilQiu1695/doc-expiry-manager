import { createContext, useContext, type ReactNode } from 'react';

import { useDocuments } from '../hooks/useDocuments';

type DocumentsContextValue = ReturnType<typeof useDocuments>;

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const value = useDocuments();
  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocumentsContext(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) {
    throw new Error('useDocumentsContext must be used within DocumentsProvider');
  }
  return ctx;
}
