"use client";

import { useState } from "react";
import { MessageSquare, Sparkles, Zap } from "lucide-react";
import { ChatTab }    from "@/components/reader/ChatTab";
import { SummaryTab } from "@/components/reader/SummaryTab";
import { ExtractTab } from "@/components/reader/ExtractTab";
import type { Document } from "@/types/documents";

type Tab = "chat" | "summary" | "extract";

interface Props {
  doc: Document;
  detailLoading: boolean;
}

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "chat",    icon: MessageSquare, label: "Chat"    },
  { id: "summary", icon: Sparkles,      label: "Summary" },
  { id: "extract", icon: Zap,           label: "Extract" },
];

export function AiPanel({ doc, detailLoading }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="w-96 shrink-0 flex flex-col bg-white">
      {/* Tab bar */}
      <div className="border-b border-slate-200 px-4 pt-3">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-700 bg-teal-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "chat"    && <ChatTab    doc={doc} />}
      {activeTab === "summary" && <SummaryTab doc={doc} detailLoading={detailLoading} />}
      {activeTab === "extract" && <ExtractTab doc={doc} detailLoading={detailLoading} />}
    </div>
  );
}