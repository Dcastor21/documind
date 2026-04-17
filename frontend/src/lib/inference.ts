import type { Document } from "@/types/documents";

export function inferDocType(doc: {
  filename: string;
  documentType?: string;
}): string {
  const t = (doc.documentType ?? "").toLowerCase();
  if (t && t !== "unknown") return t;
  const n = doc.filename.toLowerCase();
  if (n.includes("invoice")) return "invoice";
  if (n.includes("receipt")) return "receipt";
  if (n.includes("contract")) return "contract";
  if (n.includes("resume") || n.includes("cv")) return "resume";
  return "unknown";
}

export function inferRisk(doc: Document): "low" | "medium" | "high" {
  if (doc.status === "failed") return "high";
  const t = inferDocType(doc);
  if (t === "contract") {
    return doc.entityCount && doc.entityCount > 15 ? "high" : "medium";
  }
  if (t === "invoice" || t === "receipt") return "low";
  if (doc.entityCount && doc.entityCount > 25) return "medium";
  return "low";
}

export function docFolder(doc: Document): string {
  const t = inferDocType(doc);
  if (t === "invoice" || t === "receipt") return "Finance";
  if (t === "contract") return "Legal";
  if (t === "resume") return "Product";
  return "Engineering";
}

export function buildSummary(doc: Document): string {
  if (!doc.extractedText) return "Waiting for AI analysis…";
  const preview = doc.extractedText.slice(0, 200).replace(/\s+/g, " ").trim();
  return preview.length === 200 ? preview + "…" : preview;
}