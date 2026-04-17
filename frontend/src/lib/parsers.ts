import type { ContentSegment } from "@/types/documents";

export function parseExtractedContent(text: string): ContentSegment[] {
  const lines = text.split("\n");
  const result: ContentSegment[] = [];
  let textBuf: string[] = [];
  let tableBuf: string[][] = [];
  let inTable = false;

  const isPipeRow = (l: string) => l.includes("|") && l.split("|").length >= 3;
  const isSepRow  = (l: string) =>
    /^\s*\|?[\s\-|]+\|?\s*$/.test(l) && l.includes("-");

  const flushText = () => {
    const s = textBuf.join("\n").trim();
    if (s) result.push({ type: "text", content: s });
    textBuf = [];
  };
  const flushTable = () => {
    if (tableBuf.length > 0) result.push({ type: "table", rows: tableBuf });
    tableBuf = [];
  };

  for (const line of lines) {
    if (isPipeRow(line)) {
      if (!inTable) { flushText(); inTable = true; }
      if (!isSepRow(line)) {
        const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0) tableBuf.push(cells);
      }
    } else {
      if (inTable) { flushTable(); inTable = false; }
      textBuf.push(line);
    }
  }

  if (inTable) flushTable();
  else flushText();

  return result;
}