import { FileIcon } from "@/components/ui/FileIcon";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { STATUS_CONFIG } from "@/config/documents";
import { inferRisk, docFolder } from "@/lib/inference";
import { timeAgo } from "@/lib/time";
import type { Document } from "@/types/documents";

interface Props {
  doc: Document;
  onOpen: (doc: Document) => void;
}

export function DocumentListItem({ doc, onOpen }: Props) {
  const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.uploaded;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 px-4 py-3"
      onClick={() => onOpen(doc)}
    >
      <FileIcon filename={doc.filename} size={18} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.filename}</p>
        <p className="text-xs text-slate-400">
          {docFolder(doc)} · {timeAgo(doc.createdAt)}
          {doc.entityCount !== undefined && ` · ${doc.entityCount} entities`}
        </p>
      </div>

      <RiskBadge risk={inferRisk(doc)} />

      <span
        className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full ${cfg.badge}`}
      >
        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    </div>
  );
}