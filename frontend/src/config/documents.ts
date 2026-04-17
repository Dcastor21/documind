import type { ElementType } from "react";
import {
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

export const FOLDERS = [
  "All Documents",
  "Finance",
  "Legal",
  "Product",
  "Engineering",
] as const;

// ─── File display ─────────────────────────────────────────────────────────────

export const FILE_ICON_MAP: Record<string, ElementType> = {
  pdf:  FileText,
  pptx: Presentation,
  ppt:  Presentation,
  docx: File,
  doc:  File,
  xlsx: FileSpreadsheet,
  xls:  FileSpreadsheet,
  png:  FileText,
  jpg:  FileText,
  jpeg: FileText,
};

export const FILE_COLOR_MAP: Record<string, string> = {
  pdf:  "text-red-500",
  pptx: "text-orange-500",
  ppt:  "text-orange-500",
  docx: "text-blue-500",
  doc:  "text-blue-500",
  xlsx: "text-green-500",
  xls:  "text-green-500",
  png:  "text-violet-500",
  jpg:  "text-violet-500",
  jpeg: "text-violet-500",
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  uploaded:   { label: "Uploaded",   dot: "bg-amber-400",              badge: "bg-amber-50 text-amber-700 border border-amber-200"      },
  processing: { label: "Processing", dot: "bg-blue-400 animate-pulse", badge: "bg-blue-50 text-blue-700 border border-blue-200"         },
  completed:  { label: "Analyzed",   dot: "bg-emerald-400",            badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  failed:     { label: "Failed",     dot: "bg-red-400",                badge: "bg-red-50 text-red-700 border border-red-200"            },
};

// ─── Risk ─────────────────────────────────────────────────────────────────────

export const RISK_STYLES: Record<
  "low" | "medium" | "high",
  { badge: string; panel: string; icon: string; text: string }
> = {
  low: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    panel: "bg-emerald-50 border border-emerald-200",
    icon:  "text-emerald-500",
    text:  "No significant risk indicators detected in this document.",
  },
  medium: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    panel: "bg-amber-50 border border-amber-200",
    icon:  "text-amber-500",
    text:  "Moderate complexity detected. Standard review process applies.",
  },
  high: {
    badge: "bg-red-50 text-red-700 border-red-200",
    panel: "bg-red-50 border border-red-200",
    icon:  "text-red-500",
    text:  "This document type or entity density suggests elevated risk. Legal review recommended.",
  },
};

// ─── Sentiment ────────────────────────────────────────────────────────────────

export const SENTIMENT_CONFIG: Record<string, { icon: string; color: string }> = {
  POSITIVE: { icon: "↑", color: "text-emerald-600" },
  NEGATIVE: { icon: "↓", color: "text-red-500"     },
  NEUTRAL:  { icon: "→", color: "text-slate-500"   },
  MIXED:    { icon: "↔", color: "text-amber-500"   },
};

// ─── Entities ─────────────────────────────────────────────────────────────────

export const ENTITY_PILL_COLORS: Record<string, string> = {
  PERSON:       "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  ORGANIZATION: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  LOCATION:     "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  DATE:         "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  QUANTITY:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export const ENTITY_FILTER_COLORS: Record<string, { on: string; off: string }> = {
  PERSON:       { on: "bg-violet-100 text-violet-700 ring-1 ring-violet-300",   off: "bg-slate-100 text-slate-500 hover:text-slate-700" },
  ORGANIZATION: { on: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",         off: "bg-slate-100 text-slate-500 hover:text-slate-700" },
  LOCATION:     { on: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300",   off: "bg-slate-100 text-slate-500 hover:text-slate-700" },
  DATE:         { on: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",      off: "bg-slate-100 text-slate-500 hover:text-slate-700" },
  QUANTITY:     { on: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300", off: "bg-slate-100 text-slate-500 hover:text-slate-700" },
};

export function entityFilterCls(type: string, active: boolean): string {
  const s = ENTITY_FILTER_COLORS[type] ?? {
    on:  "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
    off: "bg-slate-100 text-slate-500 hover:text-slate-700",
  };
  return active ? s.on : s.off;
}

// ─── Insights ─────────────────────────────────────────────────────────────────
// Full class strings — never interpolated — so Tailwind includes them in the bundle.

export const INSIGHT_STYLES: Record<string, { bg: string; icon: string }> = {
  red:    { bg: "bg-red-50",    icon: "text-red-500"    },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-500"   },
  violet: { bg: "bg-violet-50", icon: "text-violet-500" },
  amber:  { bg: "bg-amber-50",  icon: "text-amber-500"  },
};