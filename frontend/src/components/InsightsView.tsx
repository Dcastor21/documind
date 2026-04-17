import { AlertCircle, CheckCircle, Hash, TrendingUp, ArrowUpRight } from "lucide-react";
import { FileIcon }  from "@/components/ui/FileIcon";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { INSIGHT_STYLES } from "@/config/documents";
import { inferRisk } from "@/lib/inference";
import { timeAgo } from "@/lib/time";
import type { Document } from "@/types/documents";

interface Props {
  documents: Document[];
  onOpen: (doc: Document) => void;
}

export function InsightsView({ documents, onOpen }: Props) {
  const completed   = documents.filter((d) => d.status === "completed");
  const processing  = documents.filter((d) => d.status === "processing" || d.status === "uploaded").length;
  const totalEntities = documents.reduce((s, d) => s + (d.entityCount ?? 0), 0);
  const docsWithEntities = documents.filter((d) => d.entityCount).length;
  const avgEntities = Math.round(totalEntities / Math.max(docsWithEntities, 1));

  const insightCards = [
    {
      title: "High Risk Documents",
      desc:  `${documents.filter((d) => inferRisk(d) === "high").length} documents flagged as high risk. Review recommended.`,
      icon:  AlertCircle,
      color: "red",
    },
    {
      title: "Analysis Complete",
      desc:  `${completed.length} of ${documents.length} documents fully analyzed. ${processing} still in progress.`,
      icon:  CheckCircle,
      color: "teal",
    },
    {
      title: "Entity Density",
      desc:  `${totalEntities.toLocaleString()} total entities extracted. Average ${avgEntities} per document.`,
      icon:  Hash,
      color: "violet",
    },
    {
      title: "Sentiment Overview",
      desc:  `${documents.filter((d) => d.sentiment?.overall === "POSITIVE").length} positive · ${documents.filter((d) => d.sentiment?.overall === "NEGATIVE").length} negative · ${documents.filter((d) => d.sentiment?.overall === "NEUTRAL").length} neutral documents.`,
      icon:  TrendingUp,
      color: "amber",
    },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <h1
        className="text-xl font-semibold text-slate-900 mb-2"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        AI Insights
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Patterns detected across your {documents.length} document
        {documents.length !== 1 ? "s" : ""}.
      </p>

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {insightCards.map((card) => {
          const s = INSIGHT_STYLES[card.color];
          return (
            <div
              key={card.title}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all"
            >
              <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${s.bg}`}>
                <card.icon size={16} className={s.icon} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{card.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Recently analyzed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Recently Analyzed
          </h2>
          <div className="space-y-2">
            {completed.slice(0, 5).map((doc) => (
              <div
                key={doc.documentId}
                className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition-all cursor-pointer flex items-center gap-4 px-4 py-3"
                onClick={() => onOpen(doc)}
              >
                <FileIcon filename={doc.filename} size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-slate-400">
                    {doc.entityCount ?? 0} entities · {timeAgo(doc.createdAt)}
                  </p>
                </div>
                <RiskBadge risk={inferRisk(doc)} />
                <ArrowUpRight size={14} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}