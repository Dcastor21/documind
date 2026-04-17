import { CheckCircle, AlertCircle, X } from "lucide-react";
import type { Toast } from "@/types/documents";

interface Props {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastList({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl pointer-events-auto backdrop-blur-xl ${
            t.status === "completed"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {t.status === "completed"
            ? <CheckCircle size={14} className="shrink-0" />
            : <AlertCircle size={14} className="shrink-0" />}
          <span className="text-sm font-medium max-w-[220px] truncate">
            {t.filename}
          </span>
          <span className="text-xs opacity-60">
            {t.status === "completed" ? "analyzed" : "failed"}
          </span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}