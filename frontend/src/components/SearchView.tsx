"use client";

import { useState } from "react";
import { Search, Clock } from "lucide-react";
import { FileIcon }  from "@/components/ui/FileIcon";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { inferRisk, docFolder } from "@/lib/inference";
import { timeAgo } from "@/lib/time";
import type { Document } from "@/types/documents";

interface Props {
  documents: Document[];
  onOpen: (doc: Document) => void;
}

export function SearchView({ documents, onOpen }: Props) {
  const [searchQ, setSearchQ] = useState("");

  const results = searchQ
    ? documents.filter((d) =>
        d.filename.toLowerCase().includes(searchQ.toLowerCase())
      )
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <h1
        className="text-xl font-semibold text-slate-900 mb-2"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Search Documents
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Filter your document library by filename.
      </p>

      <div className="relative max-w-2xl mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" />
        <input
          autoFocus
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search by filename…"
          className="w-full pl-11 pr-4 py-3.5 text-sm bg-white border-2 border-teal-400 rounded-2xl shadow-sm focus:outline-none transition-all"
        />
      </div>

      {searchQ ? (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">
              No documents match &ldquo;{searchQ}&rdquo;
            </p>
          ) : (
            results.map((doc) => (
              <div
                key={doc.documentId}
                className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 px-4 py-3"
                onClick={() => { onOpen(doc); setSearchQ(""); }}
              >
                <FileIcon filename={doc.filename} size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-slate-400">
                    {docFolder(doc)} · {timeAgo(doc.createdAt)}
                  </p>
                </div>
                <RiskBadge risk={inferRisk(doc)} />
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Recent Documents
          </p>
          {documents.slice(0, 5).map((doc) => (
            <div
              key={doc.documentId}
              className="flex items-center gap-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors"
              onClick={() => onOpen(doc)}
            >
              <Clock size={13} className="text-slate-300 shrink-0" />
              <span className="text-sm text-slate-600 truncate">{doc.filename}</span>
              <span className="ml-auto text-xs text-slate-400 shrink-0">
                {timeAgo(doc.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}