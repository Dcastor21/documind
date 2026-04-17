"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import {
  FileText, Search, Bell, Filter, Grid, List,
  Star, AlertCircle, RefreshCw, Plus,
} from "lucide-react";
import { DocumentCard } from "@/components/library/DocumentCard";
import { DocumentListItem } from "@/components/library/DocumentListItem";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { inferRisk, docFolder, buildSummary } from "@/lib/inference";
import { timeAgo } from "@/lib/time";
import { FileIcon } from "@/components/ui/FileIcon";
import { Brain, TrendingUp } from "lucide-react";
import type { Document } from "@/types/documents";

interface Props {
  documents: Document[];
  loading: boolean;
  fetchError: string | null;
  folder: string;
  onOpen: (doc: Document) => void;
  onRetry: () => void;
  onUpload: () => void;
  starredIds: Set<string>;
  onToggleStar: (id: string, e: MouseEvent) => void;
}

export function LibraryView({
  documents,
  loading,
  fetchError,
  folder,
  onOpen,
  onRetry,
  onUpload,
  starredIds,
  onToggleStar,
}: Props) {
  const [searchQ, setSearchQ] = useState("");
  const [layout, setLayout]   = useState<"grid" | "list">("grid");

  const filtered = documents.filter((d) => {
    const matchFolder = folder === "All Documents" || docFolder(d) === folder;
    const matchSearch = d.filename.toLowerCase().includes(searchQ.toLowerCase());
    return matchFolder && matchSearch;
  });

  const starred = documents.filter((d) => starredIds.has(d.documentId));

  const processingCount = documents.filter(
    (d) => d.status === "processing" || d.status === "uploaded"
  ).length;

  const stats = [
    { label: "Documents",  value: documents.length,                                         icon: FileText,    color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Analyzed",   value: documents.filter((d) => d.status === "completed").length, icon: Brain,       color: "text-teal-600",   bg: "bg-teal-50"   },
    { label: "Failed",     value: documents.filter((d) => d.status === "failed").length,    icon: AlertCircle, color: "text-red-500",    bg: "bg-red-50"    },
    { label: "Processing", value: processingCount,                                           icon: TrendingUp,  color: "text-amber-600",  bg: "bg-amber-50"  },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-xl font-semibold text-slate-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {folder === "All Documents" ? "Document Library" : folder}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {processingCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {processingCount} processing
              </span>
            )}
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell size={16} />
            </button>
            <button
              onClick={() => setLayout((l) => (l === "grid" ? "list" : "grid"))}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {layout === "grid" ? <List size={16} /> : <Grid size={16} />}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
              <Filter size={13} /> Filter
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search documents by name…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Stat cards */}
        {!loading && documents.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon size={16} className={s.color} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Starred strip */}
        {!loading && starred.length > 0 && folder === "All Documents" && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Starred
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {starred.map((doc) => (
                <button
                  key={doc.documentId}
                  onClick={() => onOpen(doc)}
                  className="flex-shrink-0 w-52 bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-teal-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <FileIcon filename={doc.filename} size={20} />
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-tight line-clamp-2 mb-2">
                    {doc.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {docFolder(doc)} · {timeAgo(doc.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document list / grid / empty / error */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 rounded-xl border border-red-200 bg-red-50">
            <AlertCircle size={20} className="text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 font-medium mb-1">Failed to load documents</p>
            <p className="text-xs text-red-400 mb-4">{fetchError}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FileText size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              {searchQ ? `No documents match "${searchQ}"` : "No documents yet"}
            </p>
            {!searchQ && (
              <button
                onClick={onUpload}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-500 transition-colors"
              >
                <Plus size={14} /> Upload Document
              </button>
            )}
          </div>
        ) : layout === "grid" ? (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.documentId}
                doc={doc}
                isStarred={starredIds.has(doc.documentId)}
                onOpen={onOpen}
                onToggleStar={onToggleStar}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => (
              <DocumentListItem key={doc.documentId} doc={doc} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}