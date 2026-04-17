"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MouseEvent } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";
import type { Document, Toast } from "@/types/documents";

export function useDocuments() {
  const [documents, setDocuments]   = useState<Document[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const prevStatuses = useRef<Record<string, string>>({});
  const toastCounter = useRef(0);

  // Uses only a functional updater — stable with empty dep array
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchDocuments = useCallback(async () => {
    setFetchError(null);
    try {
      const { data } = await axios.get(`${API_URL}/api/documents`);
      const incoming: Document[] = data.documents ?? [];

      const newToasts: Toast[] = [];
      for (const doc of incoming) {
        const prev = prevStatuses.current[doc.documentId];
        if (
          prev !== undefined &&
          prev !== doc.status &&
          (doc.status === "completed" || doc.status === "failed")
        ) {
          const toast: Toast = {
            id: ++toastCounter.current,
            filename: doc.filename,
            status: doc.status,
          };
          newToasts.push(toast);
          setTimeout(() => dismissToast(toast.id), 5000);
        }
        prevStatuses.current[doc.documentId] = doc.status;
      }

      if (newToasts.length) {
        setToasts((prev) => [...prev, ...newToasts]);
      }

      setDocuments(incoming);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setFetchError("Failed to load documents. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [dismissToast]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-refresh every 10 s while any document is pending
  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.status === "uploaded" || d.status === "processing"
    );
    if (!hasPending) return;
    const id = setTimeout(fetchDocuments, 10_000);
    return () => clearTimeout(id);
  }, [documents, fetchDocuments]);

  const toggleStar = useCallback((id: string, e: MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return {
    documents,
    loading,
    fetchError,
    fetchDocuments,
    toasts,
    dismissToast,
    starredIds,
    toggleStar,
  };
}