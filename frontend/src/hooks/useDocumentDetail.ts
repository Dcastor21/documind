"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";
import type { Document } from "@/types/documents";

export function useDocumentDetail() {
  const [selected, setSelected]           = useState<Document | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch full detail from the API — replaces the partial preview doc
  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/documents/${id}`);
      setSelected(data);
    } catch (err) {
      console.error("Failed to fetch document detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Immediately populate selected with partial list data so the reader
  // renders at once, then fetchDetail will overwrite with the full record.
  const previewDocument = useCallback((doc: Document) => {
    setSelected(doc);
  }, []);

  return { selected, detailLoading, previewDocument, fetchDetail };
}