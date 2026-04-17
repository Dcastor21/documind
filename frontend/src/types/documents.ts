export interface DocEntity {
  text: string;
  type: string;
  score: number;
}

export interface Document {
  documentId: string;
  filename: string;
  documentType?: string;
  status: string;
  createdAt: string;
  entityCount?: number;
  sentiment?: { overall: string };
  extractedText?: string;
  entities?: DocEntity[];
  textractConfidence?: number;
}

export interface Toast {
  id: number;
  filename: string;
  status: "completed" | "failed";
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  cards?: { label: string; value: string }[];
}

export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "table"; rows: string[][] };

export type View = "library" | "reader" | "search" | "insights";