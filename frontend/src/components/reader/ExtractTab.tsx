"use client";

import { useState, useCallback } from "react";
import { Tag, CheckCircle, Copy } from "lucide-react";
import { ENTITY_PILL_COLORS, entityFilterCls } from "@/config/documents";
import type { Document } from "@/types/documents";

interface Props {
  doc: Document;
  detailLoading: boolean;
}

export function ExtractTab({ doc, detailLoading }: Props) {
  const [entityFilter, setEntityFilter] = useState<string | null>(null);
  const [textCopied, setTextCopied]     = useState(false);

  const handleCopy = useCallback(() => {
    if (!doc.extractedText) return;
    navigator.clipboard.writeText(doc.extractedText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  }, [doc.extractedText]);

  if (detailLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  const hasEntities = doc.entities && doc.entities.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <p className="text-xs text-slate-500 leading-relaxed">
        Entities extracted automatically by Amazon Comprehend. Filter by type below.
      </p>

      {!hasEntities ? (
        <div className="text-center py-8">
          <Tag size={20} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            {doc.status === "completed"
              ? "No entities detected"
              : "Waiting for analysis to complete"}
          </p>
        </div>
      ) : (
        <>
          {/* Type filter pills */}
          {(() => {
            const types = Array.from(new Set(doc.entities!.map((e) => e.type)));
            const displayEntities = entityFilter
              ? doc.entities!.filter((e) => e.type === entityFilter)
              : doc.entities!;

            return (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setEntityFilter(null)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      entityFilter === null
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    All ({doc.entities!.length})
                  </button>
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setEntityFilter(entityFilter === type ? null : type)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${entityFilterCls(type, entityFilter === type)}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Entity pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {displayEntities.map((ent, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                        ENTITY_PILL_COLORS[ent.type] ??
                        "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {ent.text}
                      <span className="opacity-40 text-[10px]">{ent.type}</span>
                    </span>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Raw extracted text */}
          {doc.extractedText && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-500">Raw Extracted Text</p>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-all ${
                    textCopied
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {textCopied ? (
                    <><CheckCircle size={10} /> Copied</>
                  ) : (
                    <><Copy size={10} /> Copy</>
                  )}
                </button>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono leading-relaxed">
                  {doc.extractedText.slice(0, 800)}
                  {doc.extractedText.length > 800 && "…"}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}