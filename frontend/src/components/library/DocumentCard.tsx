import type { MouseEvent } from "react";
import { Star, MoreHorizontal } from "lucide-react";
import { FileIcon } from "@/components/ui/FileIcon";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { STATUS_CONFIG } from "@/config/documents";
import { inferRisk, buildSummary } from "@/lib/inference";
import { fileExt, timeAgo } from "@/lib/time";
import type { Document } from "@/types/documents";

interface Props {
  doc: Document;
  isStarred: boolean;
  onOpen: (doc: Document) => void;
  onToggleStar: (id: string, e: MouseEvent) => void;
}

export function DocumentCard({ doc, isStarred, onOpen, onToggleStar }: Props) {
  const risk = inferRisk(doc);
  const cfg  = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.uploaded;

  return (
    <div
      className="doc-card bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onOpen(doc)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileIcon filename={doc.filename} size={18} />
            <span className="text-[10px] font-medium uppercase text-slate-400">
              {fileExt(doc.filename)}
            </span>
          </div>
          <div className="doc-actions flex items-center gap-1">
            <button
              onClick={(e) => onToggleStar(doc.documentId, e)}
              className="p-1 text-slate-300 hover:text-amber-400 rounded transition-colors"
            >
              <Star
                size={12}
                className={isStarred ? "text-amber-400 fill-amber-400" : ""}
              />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-800 leading-tight mb-2 line-clamp-2">
          {doc.filename}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {buildSummary(doc)}
        </p>

        <div className="flex items-center justify-between">
          <RiskBadge risk={risk} />
          <span
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cfg.badge}`}
          >
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {doc.entityCount !== undefined ? `${doc.entityCount} entities` : "—"}
        </span>
        <span className="text-[10px] text-slate-400">{timeAgo(doc.createdAt)}</span>
      </div>
    </div>
  );
}