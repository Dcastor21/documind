import { FileText } from "lucide-react";
import { FILE_ICON_MAP, FILE_COLOR_MAP } from "@/config/documents";

interface Props {
  filename: string;
  size?: number;
}

export function FileIcon({ filename, size = 16 }: Props) {
  const ext   = filename.split(".").pop()?.toLowerCase() ?? "";
  const Icon  = FILE_ICON_MAP[ext] ?? FileText;
  const color = FILE_COLOR_MAP[ext] ?? "text-slate-400";
  return <Icon size={size} className={color} />;
}