"use client";

import { useState } from "react";
import {
  ChevronLeft, Share2, Download, Loader,
  AlertCircle, Sparkles, PanelRight, PanelRightClose,
} from "lucide-react";
import { AiPanel }   from "@/components/reader/AiPanel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { inferDocType, inferRisk, buildSummary, docFolder } from "@/lib/inference";
import { timeAgo } from "@/lib/time";
import { parseExtractedContent } from "@/lib/parsers";
import type { Document } from "@/types/documents";

interface Props {
  doc: Document;
  detailLoading: boolean;
  onBack: () => void;
}

export function ReaderView({ doc, detailLoading, onBack }: Props) {
  const [showPanel, setShowPanel] = useState(true);
  const risk = inferRisk(doc);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Document pane */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              <ChevronLeft size={15} /> Library
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 text-sm">{docFolder(doc)}</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-700 truncate max-w-xs">
              {doc.filename}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <RiskBadge risk={risk} />
              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Share2 size={14} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Download size={14} />
              </button>
              <button
                onClick={() => setShowPanel((p) => !p)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {showPanel ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Document body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 flex items-start justify-center py-8 px-6">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-sm border border-slate-200 p-10 min-h-96">
            {/* Document header */}
            <div className="text-center mb-8 pb-6 border-b border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                {inferDocType(doc).toUpperCase()}
              </p>
              <h2
                className="text-2xl font-bold text-slate-900 mb-1 leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {doc.filename}
              </h2>
              <p className="text-sm text-slate-500">Uploaded {timeAgo(doc.createdAt)}</p>
            </div>

            {/* AI summary banner */}
            {doc.status === "completed" && doc.extractedText && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex gap-3">
                <Sparkles size={15} className="text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-teal-800 mb-0.5">AI Summary</p>
                  <p className="text-sm text-teal-700">{buildSummary(doc)}</p>
                </div>
              </div>
            )}

            {/* Status states */}
            {(doc.status === "processing" || doc.status === "uploaded") && (
              <div className="flex items-center gap-3 py-12 justify-center">
                <Loader size={18} className="text-teal-500 animate-spin" />
                <p className="text-sm text-slate-500">Analyzing document…</p>
              </div>
            )}

            {doc.status === "failed" && (
              <div className="flex items-center gap-3 py-12 justify-center text-red-500">
                <AlertCircle size={18} />
                <p className="text-sm">Analysis failed. Please re-upload the document.</p>
              </div>
            )}

            {/* Extracted content — text and tables */}
            {doc.status === "completed" && doc.extractedText && (
              <div className="space-y-4">
                {parseExtractedContent(doc.extractedText).map((seg, i) =>
                  seg.type === "table" ? (
                    <div key={i} className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            {seg.rows[0].map((cell, ci) => (
                              <th
                                key={ci}
                                className="text-left px-3 py-2 text-slate-600 border-b border-slate-200 font-medium bg-slate-50 whitespace-nowrap"
                              >
                                {cell}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {seg.rows.slice(1).map((row, ri) => (
                            <tr key={ri} className="hover:bg-slate-50 transition-colors">
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className="px-3 py-2 text-slate-600 border-b border-slate-100 whitespace-nowrap"
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
                    <pre
                      key={i}
                      className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed"
                    >
                      {seg.content}
                    </pre>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI panel */}
      {showPanel && <AiPanel doc={doc} detailLoading={detailLoading} />}
    </div>
  );
}