import { Sparkles, AlertCircle } from "lucide-react";
import { SENTIMENT_CONFIG, RISK_STYLES } from "@/config/documents";
import { inferDocType, buildSummary, inferRisk } from "@/lib/inference";
import { timeAgo } from "@/lib/time";
import type { Document } from "@/types/documents";

interface Props {
  doc: Document;
  detailLoading: boolean;
}

export function SummaryTab({ doc, detailLoading }: Props) {
  const risk = inferRisk(doc);

  if (detailLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  const sentimentLabel = doc.sentiment?.overall
    ? `${SENTIMENT_CONFIG[doc.sentiment.overall]?.icon ?? ""} ${doc.sentiment.overall}`
    : "—";

  const metaRows = [
    { label: "Filename",   content: doc.filename                         },
    { label: "Type",       content: inferDocType(doc).toUpperCase()      },
    { label: "Uploaded",   content: timeAgo(doc.createdAt)               },
    { label: "Entities",   content: String(doc.entityCount ?? 0)         },
    { label: "Sentiment",  content: sentimentLabel                        },
    { label: "Confidence", content: doc.textractConfidence ? `${doc.textractConfidence}%` : "—" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Summary banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-teal-600" />
          <p className="text-xs font-semibold text-teal-700">AI-Generated Summary</p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{buildSummary(doc)}</p>
      </div>

      {/* Metadata rows */}
      {metaRows.map((item) => (
        <div key={item.label} className="border-b border-slate-100 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {item.label}
          </p>
          <p className="text-sm text-slate-700">{item.content}</p>
        </div>
      ))}

      {/* OCR confidence bar */}
      {doc.textractConfidence && (
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
            <span>OCR Confidence</span>
            <span>{doc.textractConfidence}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${doc.textractConfidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Risk assessment */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Risk Assessment
        </p>
        <div className={`flex items-start gap-2.5 p-3 rounded-lg ${RISK_STYLES[risk].panel}`}>
          <AlertCircle size={13} className={`${RISK_STYLES[risk].icon} shrink-0 mt-0.5`} />
          <p className="text-xs text-slate-700">{RISK_STYLES[risk].text}</p>
        </div>
      </div>
    </div>
  );
}