import { X, Sparkles } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function UploadModal({ open, onClose, onComplete }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            className="text-base font-semibold text-slate-800"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Upload Document
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <DocumentUpload
            onUploadComplete={() => {
              onComplete();
              onClose();
            }}
          />
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles size={10} className="text-teal-500" />
            Analysis starts automatically via Textract + Comprehend
          </p>
        </div>
      </div>
    </div>
  );
}