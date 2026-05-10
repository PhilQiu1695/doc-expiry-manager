import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  cancelExpiryReminder,
  scheduleExpiryReminder,
} from '../lib/expiryReminder';
import { isDocumentCategoryId } from '../constants/documentCategories';
import type { Document } from '../types/document';
import { sortDocumentsByExpiry } from '../utils/sortDocuments';

const STORAGE_KEY = '@doc-expiry-manager/documents';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDoc(raw: unknown): Document | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : createId();
  const name = typeof o.name === 'string' ? o.name : 'Untitled';
  const expiryDate =
    typeof o.expiryDate === 'string' ? o.expiryDate : new Date().toISOString().slice(0, 10);

  const holder = typeof o.holder === 'string' ? o.holder : '';

  let issueDate: string | null = null;
  if (typeof o.issueDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(o.issueDate)) {
    issueDate = o.issueDate.slice(0, 10);
  }

  const comments = typeof o.comments === 'string' ? o.comments : '';

  const category =
    typeof o.category === 'string' && isDocumentCategoryId(o.category) ? o.category : 'other';

  return { id, category, name, holder, issueDate, expiryDate, comments };
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            const loaded = sortDocumentsByExpiry(
              parsed.map(normalizeDoc).filter((d): d is Document => d != null),
            );
            setDocuments(loaded);
            for (const doc of loaded) {
              void scheduleExpiryReminder(doc);
            }
          }
        }
      } catch {
        // Keep empty list on corrupt storage
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents)).catch(() => {});
  }, [documents, isReady]);

  const addDocument = useCallback(
    async (input: Omit<Document, 'id'> & { id?: string }) => {
      const doc: Document = {
        id: input.id ?? createId(),
        category: input.category,
        name: input.name,
        holder: input.holder,
        issueDate: input.issueDate,
        expiryDate: input.expiryDate,
        comments: input.comments,
      };
      setDocuments((prev) => sortDocumentsByExpiry([...prev, doc]));
      await scheduleExpiryReminder(doc);
      return doc;
    },
    [],
  );

  const updateDocument = useCallback(async (doc: Document) => {
    setDocuments((prev) =>
      sortDocumentsByExpiry(prev.map((d) => (d.id === doc.id ? doc : d))),
    );
    await scheduleExpiryReminder(doc);
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    await cancelExpiryReminder(id);
  }, []);

  const replaceDocuments = useCallback((next: Document[]) => {
    setDocuments(sortDocumentsByExpiry(next));
  }, []);

  return {
    documents,
    isReady,
    addDocument,
    updateDocument,
    removeDocument,
    replaceDocuments,
  };
}
