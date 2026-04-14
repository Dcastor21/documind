"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import DocumentUpload from "@/components/DocumentUpload";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocEntity {
  text: string;
  type: string;
  score: number;
}

interface Document {
  documentId: string;
  filename: string;
  documentType?: string;
  status: string;
  createdAt: string;
  entityCount?: number;
  sentiment?: { overall: string };
  extractedText?: string;
  entities?: DocEntity[];
  textractConfidence?: number;
}

interface Toast {
  id: number;
  filename: string;
  status: "completed" | "failed";
}

type ContentSegment =
  | { type: "text"; content: string }
  | { type: "table"; rows: string[][] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return filename.split(".").pop()?.toUpperCase() ?? "DOC";
}

function inferDocType(doc: { filename: string; documentType?: string }): string {
  const t = (doc.documentType ?? "").toLowerCase();
  if (t && t !== "unknown") return t;
  const n = doc.filename.toLowerCase();
  if (n.includes("invoice")) return "invoice";
  if (n.includes("receipt")) return "receipt";
  if (n.includes("contract")) return "contract";
  if (n.includes("resume") || n.includes("cv")) return "resume";
  return "unknown";
}

// Parse pipe-delimited tables out of extracted text
function parseExtractedContent(text: string): ContentSegment[] {
  const lines = text.split("\n");
  const result: ContentSegment[] = [];
  let textBuf: string[] = [];
  let tableBuf: string[][] = [];
  let inTable = false;

  const isPipeRow = (l: string) => l.includes("|") && l.split("|").length >= 3;
  const isSepRow  = (l: string) => /^\s*\|?[\s\-|]+\|?\s*$/.test(l) && l.includes("-");

  const flushText = () => {
    const s = textBuf.join("\n").trim();
    if (s) result.push({ type: "text", content: s });
    textBuf = [];
  };
  const flushTable = () => {
    if (tableBuf.length > 0) result.push({ type: "table", rows: tableBuf });
    tableBuf = [];
  };

  for (const line of lines) {
    if (isPipeRow(line)) {
      if (!inTable) { flushText(); inTable = true; }
      if (!isSepRow(line)) {
        const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0) tableBuf.push(cells);
      }
    } else {
      if (inTable) { flushTable(); inTable = false; }
      textBuf.push(line);
    }
  }
  if (inTable) flushTable();
  else flushText();

  return result;
}

// ─── Config maps ─────────────────────────────────────────────────────────────

const docTypeStyle: Record<string, { bg: string; text: string }> = {
  invoice:  { bg: "bg-violet-500/15", text: "text-violet-300" },
  resume:   { bg: "bg-teal-500/15",   text: "text-teal-300"   },
  contract: { bg: "bg-sky-500/15",    text: "text-sky-300"    },
  receipt:  { bg: "bg-pink-500/15",   text: "text-pink-300"   },
  unknown:  { bg: "bg-white/[0.06]",  text: "text-slate-400"  },
};

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  uploaded:   { label: "Uploaded",   dot: "bg-amber-400",              badge: "bg-amber-400/10   text-amber-400   ring-1 ring-amber-400/20"   },
  processing: { label: "Processing", dot: "bg-blue-400 animate-pulse", badge: "bg-blue-400/10    text-blue-400    ring-1 ring-blue-400/20"    },
  completed:  { label: "Completed",  dot: "bg-emerald-400",            badge: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20" },
  failed:     { label: "Failed",     dot: "bg-red-400",                badge: "bg-red-400/10     text-red-400     ring-1 ring-red-400/20"     },
};

const sentimentConfig: Record<string, { icon: string; color: string }> = {
  POSITIVE: { icon: "↑", color: "text-emerald-400" },
  NEGATIVE: { icon: "↓", color: "text-red-400"     },
  NEUTRAL:  { icon: "→", color: "text-slate-400"   },
  MIXED:    { icon: "↔", color: "text-amber-400"   },
};

const entityPillColors: Record<string, string> = {
  PERSON:       "bg-violet-500/10  text-violet-400  ring-1 ring-violet-500/20",
  ORGANIZATION: "bg-blue-500/10    text-blue-400    ring-1 ring-blue-500/20",
  LOCATION:     "bg-indigo-500/10  text-indigo-400  ring-1 ring-indigo-500/20",
  DATE:         "bg-amber-500/10   text-amber-400   ring-1 ring-amber-500/20",
  QUANTITY:     "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
};

const entityFilterColors: Record<string, { on: string; off: string }> = {
  PERSON:       { on: "bg-violet-500/20  text-violet-300  ring-1 ring-violet-500/40",  off: "bg-white/[0.04] text-slate-500 hover:text-slate-300" },
  ORGANIZATION: { on: "bg-blue-500/20    text-blue-300    ring-1 ring-blue-500/40",    off: "bg-white/[0.04] text-slate-500 hover:text-slate-300" },
  LOCATION:     { on: "bg-indigo-500/20  text-indigo-300  ring-1 ring-indigo-500/40",  off: "bg-white/[0.04] text-slate-500 hover:text-slate-300" },
  DATE:         { on: "bg-amber-500/20   text-amber-300   ring-1 ring-amber-500/40",   off: "bg-white/[0.04] text-slate-500 hover:text-slate-300" },
  QUANTITY:     { on: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40", off: "bg-white/[0.04] text-slate-500 hover:text-slate-300" },
};

function entityFilterCls(type: string, active: boolean): string {
  const s = entityFilterColors[type] ?? {
    on:  "bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/40",
    off: "bg-white/[0.04] text-slate-500 hover:text-slate-300",
  };
  return active ? s.on : s.off;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl pointer-events-auto backdrop-blur-xl ${
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
          <button onClick={() => onDismiss(t.id)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [documents, setDocuments]         = useState<Document[]>([]);
  const [selected, setSelected]           = useState<Document | null>(null);
  const [loading, setLoading]             = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const [entityFilter, setEntityFilter]   = useState<string | null>(null);
  const [textCopied, setTextCopied]       = useState(false);

  const prevStatuses = useRef<Record<string, string>>({});
  const toastCounter = useRef(0);

  const dismissToast = (id: number) => setToasts((t) => t.filter((n) => n.id !== id));

  const fetchDocuments = async () => {
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
    setEntityFilter(null);
    setTextCopied(false);
    try {
      const { data } = await axios.get(`${API_URL}/api/documents/${id}`);
      setSelected(data);
    } finally {
      setDetailLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocuments(); }, []);

  // Auto-refresh every 10 s while any document is pending
  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.status === "uploaded" || d.status === "processing"
    );
    if (!hasPending) return;
    const id = setTimeout(fetchDocuments, 10_000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const handleCopy = () => {
    if (!selected?.extractedText) return;
    navigator.clipboard.writeText(selected.extractedText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  };

  const counts = {
    total:      documents.length,
    uploaded:   documents.filter((d) => d.status === "uploaded").length,
    processing: documents.filter((d) => d.status === "processing").length,
    completed:  documents.filter((d) => d.status === "completed").length,
    failed:     documents.filter((d) => d.status === "failed").length,
  };

  return (
    <div className="min-h-screen bg-[#0b0b12]">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0d0d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
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
            {!loading && (
              <span>{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
            )}
            {counts.processing + counts.uploaded > 0 && (
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {counts.processing + counts.uploaded} processing
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Stats bar ── */}
        {!loading && documents.length > 0 && (
          <div className="grid grid-cols-5 gap-3 mb-8">
            {(
              [
                { label: "Total",      value: counts.total,      color: "text-slate-200"   },
                { label: "Uploaded",   value: counts.uploaded,   color: "text-amber-400"   },
                { label: "Processing", value: counts.processing, color: "text-blue-400"    },
                { label: "Completed",  value: counts.completed,  color: "text-emerald-400" },
                { label: "Failed",     value: counts.failed,     color: "text-red-400"     },
              ] as const
            ).map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className={`grid gap-6 ${selected ? "lg:grid-cols-[1fr_440px]" : ""}`}>

          {/* Left column */}
          <div className="space-y-6 min-w-0">
            <section>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-3">
                Upload Document
              </p>
              <DocumentUpload onUploadComplete={fetchDocuments} />
            </section>

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
                    const dt  = inferDocType(doc);
                    const dts = docTypeStyle[dt] ?? docTypeStyle.unknown;
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
                        {/* Color-coded file icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold tracking-tight ${dts.bg} ${dts.text}`}>
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
                          {/* Status badge with animated pulse dot */}
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

          {/* ── Detail panel ── */}
          {selected && (
            <aside className="rounded-2xl bg-white/[0.03] border border-white/[0.08] h-fit lg:sticky lg:top-24 overflow-hidden">

              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const dts = docTypeStyle[inferDocType(selected)] ?? docTypeStyle.unknown;
                    return (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-bold tracking-tight ${dts.bg} ${dts.text}`}>
                        {fileExt(selected.filename)}
                      </div>
                    );
                  })()}
                  <h3 className="text-sm font-medium text-slate-200 truncate">{selected.filename}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {detailLoading ? (
                <div className="p-5 space-y-4 animate-pulse">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-white/[0.04]" />)}
                  </div>
                  <div className="h-3 rounded bg-white/[0.04]" />
                  <div className="h-24 rounded-lg bg-white/[0.04]" />
                  <div className="h-36 rounded-lg bg-white/[0.04]" />
                </div>
              ) : (
                <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">

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
                        <span className="text-sm font-semibold text-slate-200">{selected.textractConfidence}%</span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </div>
                  </div>

                  {/* OCR confidence bar */}
                  {selected.textractConfidence && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                        <span>OCR Confidence</span>
                        <span>{selected.textractConfidence}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${selected.textractConfidence}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Entity viewer ── */}
                  {selected.entities && selected.entities.length > 0 && (() => {
                    const types    = Array.from(new Set(selected.entities.map((e) => e.type)));
                    const filtered = entityFilter
                      ? selected.entities.filter((e) => e.type === entityFilter)
                      : selected.entities;
                    return (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">
                          Entities
                          <span className="ml-1.5 font-normal text-slate-600">
                            ({filtered.length}{entityFilter ? ` of ${selected.entities!.length}` : ""})
                          </span>
                        </p>

                        {/* Filter pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <button
                            onClick={() => setEntityFilter(null)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                              entityFilter === null
                                ? "bg-white/[0.12] text-slate-200"
                                : "bg-white/[0.04] text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            All
                          </button>
                          {types.map((type) => (
                            <button
                              key={type}
                              onClick={() => setEntityFilter(entityFilter === type ? null : type)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${entityFilterCls(type, entityFilter === type)}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>

                        {/* Entity pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {filtered.map((ent, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                                entityPillColors[ent.type] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20"
                              }`}
                            >
                              {ent.text}
                              <span className="opacity-40 text-[10px]">{ent.type}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Text / table viewer ── */}
                  {selected.extractedText && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-400">Extracted Text</p>
                        <button
                          onClick={handleCopy}
                          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-all ${
                            textCopied
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]"
                          }`}
                        >
                          {textCopied ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      <div className="rounded-lg bg-[#090910] border border-white/[0.06] p-3 max-h-72 overflow-y-auto space-y-3">
                        {parseExtractedContent(selected.extractedText).map((seg, i) =>
                          seg.type === "table" ? (
                            <div key={i} className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr>
                                    {seg.rows[0].map((cell, ci) => (
                                      <th
                                        key={ci}
                                        className="text-left px-2 py-1.5 text-slate-400 border-b border-white/[0.10] font-medium bg-white/[0.04] whitespace-nowrap"
                                      >
                                        {cell}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {seg.rows.slice(1).map((row, ri) => (
                                    <tr key={ri} className="hover:bg-white/[0.03] transition-colors">
                                      {row.map((cell, ci) => (
                                        <td
                                          key={ci}
                                          className="px-2 py-1.5 text-slate-300 border-b border-white/[0.04] whitespace-nowrap"
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <pre key={i} className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                              {seg.content}
                            </pre>
                          )
                        )}
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
