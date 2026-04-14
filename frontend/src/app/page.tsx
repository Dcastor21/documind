"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import DocumentUpload from "@/components/DocumentUpload";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DocEntity {
  text: string;
  type: string;
  score: number;
}

interface Document {
  documentId: string;
  filename: string;
  status: string;
  createdAt: string;
  entityCount?: number;
  sentiment?: { overall: string };
  extractedText?: string;
  entities?: DocEntity[];
  textractConfidence?: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fileExt(filename: string) {
  return filename.split(".").pop()?.toUpperCase() || "DOC";
}

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  uploaded:   { label: "Uploaded",   dot: "bg-amber-400",               badge: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20" },
  processing: { label: "Processing", dot: "bg-blue-400 animate-pulse",  badge: "bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20" },
  completed:  { label: "Completed",  dot: "bg-emerald-400",             badge: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20" },
  failed:     { label: "Failed",     dot: "bg-red-400",                 badge: "bg-red-400/10 text-red-400 ring-1 ring-red-400/20" },
};

const sentimentConfig: Record<string, { icon: string; color: string }> = {
  POSITIVE: { icon: "↑", color: "text-emerald-400" },
  NEGATIVE: { icon: "↓", color: "text-red-400" },
  NEUTRAL:  { icon: "→", color: "text-slate-400" },
  MIXED:    { icon: "↔", color: "text-amber-400" },
};

const entityTypeColors: Record<string, string> = {
  PERSON:       "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  LOCATION:     "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  ORGANIZATION: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20",
  DATE:         "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  QUANTITY:     "bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20",
};

interface Toast {
  id: number;
  filename: string;
  status: "completed" | "failed";
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl pointer-events-auto backdrop-blur-xl transition-all ${
            t.status === "completed"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
              : "bg-red-500/10 border-red-500/25 text-red-300"
          }`}
        >
          {t.status === "completed" ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-medium max-w-[220px] truncate">{t.filename}</span>
          <span className="text-xs opacity-60">{t.status === "completed" ? "processed" : "failed"}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/[0.06] rounded w-2/3" />
        <div className="h-2 bg-white/[0.04] rounded w-1/3" />
      </div>
      <div className="w-20 h-5 rounded-full bg-white/[0.06]" />
    </div>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevStatuses = useRef<Record<string, string>>({});
  const toastCounter = useRef(0);

  const dismissToast = (id: number) =>
    setToasts((t) => t.filter((n) => n.id !== id));

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/documents`);
      const incoming: Document[] = data.documents || [];

      // Fire a toast for any doc that just reached completed/failed
      const newToasts: Toast[] = [];
      for (const doc of incoming) {
        const prev = prevStatuses.current[doc.documentId];
        if (
          prev !== undefined &&
          prev !== doc.status &&
          (doc.status === "completed" || doc.status === "failed")
        ) {
          newToasts.push({ id: ++toastCounter.current, filename: doc.filename, status: doc.status });
        }
        prevStatuses.current[doc.documentId] = doc.status;
      }
      if (newToasts.length) {
        setToasts((t) => [...t, ...newToasts]);
        newToasts.forEach((n) => setTimeout(() => dismissToast(n.id), 5000));
      }

      setDocuments(incoming);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/documents/${id}`);
      setSelected(data);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll every 4s while any document is still processing
  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.status === "uploaded" || d.status === "processing"
    );
    if (!hasPending) return;
    const id = setTimeout(fetchDocuments, 4000);
    return () => clearTimeout(id);
  }, [documents]);

  const completedCount  = documents.filter((d) => d.status === "completed").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;

  return (
    <div className="min-h-screen bg-[#0b0b12]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0d0d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-white text-base tracking-tight">DocuMind</span>
              <span className="hidden sm:inline ml-2 text-xs text-slate-500">AI Document Analysis</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            {!loading && <span>{documents.length} document{documents.length !== 1 ? "s" : ""}</span>}
            {processingCount > 0 && (
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {processingCount} processing
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        {!loading && documents.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total",      value: documents.length, color: "text-slate-200" },
              { label: "Completed",  value: completedCount,   color: "text-emerald-400" },
              { label: "Processing", value: processingCount,  color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Two-column layout when detail is open */}
        <div className={`grid gap-6 transition-all ${selected ? "lg:grid-cols-[1fr_420px]" : ""}`}>
          {/* Left column */}
          <div className="space-y-6 min-w-0">
            {/* Upload */}
            <section>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-3">
                Upload Document
              </p>
              <DocumentUpload onUploadComplete={fetchDocuments} />
            </section>

            {/* Document list */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                  Documents
                </p>
                {!loading && documents.length > 0 && (
                  <span className="text-xs text-slate-600">{documents.length} total</span>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-14 rounded-xl border border-dashed border-white/[0.07]">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">No documents yet</p>
                  <p className="text-xs text-slate-600 mt-1">Upload a file above to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const cfg = statusConfig[doc.status] ?? statusConfig.uploaded;
                    const isSelected = selected?.documentId === doc.documentId;
                    return (
                      <button
                        key={doc.documentId}
                        onClick={() => fetchDetail(doc.documentId)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                          isSelected
                            ? "bg-indigo-500/10 border-indigo-500/30"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold tracking-tight ${
                          isSelected
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-white/[0.06] text-slate-400"
                        }`}>
                          {fileExt(doc.filename)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{doc.filename}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{timeAgo(doc.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {doc.entityCount !== undefined && doc.entityCount > 0 && (
                            <span className="text-xs text-slate-600 hidden sm:inline">
                              {doc.entityCount} entities
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right — Detail panel */}
          {selected && (
            <aside className="rounded-2xl bg-white/[0.03] border border-white/[0.08] h-fit lg:sticky lg:top-24 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-[9px] font-bold text-slate-400 tracking-tight">
                    {fileExt(selected.filename)}
                  </div>
                  <h3 className="text-sm font-medium text-slate-200 truncate">{selected.filename}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors shrink-0"
                  aria-label="Close detail"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {detailLoading ? (
                <div className="p-5 space-y-4 animate-pulse">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-white/[0.04]" />
                    ))}
                  </div>
                  <div className="h-3 bg-white/[0.04] rounded w-full" />
                  <div className="h-24 rounded-lg bg-white/[0.04]" />
                  <div className="h-32 rounded-lg bg-white/[0.04]" />
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-slate-500 mb-1.5">Status</p>
                      {(() => {
                        const cfg = statusConfig[selected.status] ?? statusConfig.uploaded;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.badge}`}>
                            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-slate-500 mb-1.5">Sentiment</p>
                      {selected.sentiment?.overall ? (
                        <span className={`text-sm font-semibold ${sentimentConfig[selected.sentiment.overall]?.color ?? "text-slate-400"}`}>
                          {sentimentConfig[selected.sentiment.overall]?.icon}{" "}
                          <span className="text-xs">{selected.sentiment.overall}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-slate-500 mb-1.5">Confidence</p>
                      {selected.textractConfidence ? (
                        <span className="text-sm font-semibold text-slate-200">
                          {selected.textractConfidence}%
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </div>
                  </div>

                  {/* Confidence bar */}
                  {selected.textractConfidence && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                        <span>OCR Confidence</span>
                        <span>{selected.textractConfidence}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                          style={{ width: `${selected.textractConfidence}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {selected.entities && selected.entities.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">
                        Entities
                        <span className="ml-1.5 text-slate-600 font-normal">({selected.entities.length})</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.entities.map((ent, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                              entityTypeColors[ent.type] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20"
                            }`}
                          >
                            {ent.text}
                            <span className="opacity-50 text-[10px]">{ent.type}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted text */}
                  {selected.extractedText && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">Extracted Text</p>
                      <div className="rounded-lg bg-[#090910] border border-white/[0.06] p-3 max-h-60 overflow-y-auto">
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                          {selected.extractedText}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
