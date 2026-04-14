"use client";

import { useState, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MIME_FALLBACKS: Record<string, string> = {
  pdf:  "application/pdf",
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
};

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_FALLBACKS[ext] ?? file.type;
}

export default function DocumentUpload({
  onUploadComplete,
}: {
  onUploadComplete: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    const contentType = resolveContentType(file);

    try {
      setProgress(20);
      const { data } = await axios.post(`${API_URL}/api/documents/upload`, {
        filename: file.name,
        contentType,
      });
      setProgress(50);
      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": contentType },
        onUploadProgress: (e) => {
          if (e.total) setProgress(50 + Math.round((e.loaded / e.total) * 45));
        },
      });
      setProgress(100);
      setSuccess(true);
      onUploadComplete();
      setTimeout(() => { setSuccess(false); setProgress(0); }, 2500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg    = err.response?.data?.error;
        setError(msg ?? (status ? `Upload failed (${status})` : "Upload failed — check your connection."));
      } else {
        setError("Upload failed. Please try again.");
      }
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
        isDragging ? "scale-[1.02]" : "scale-100"
      } ${
        isDragging
          ? "border-indigo-500/60 bg-indigo-500/[0.08] shadow-lg shadow-indigo-500/10"
          : uploading
          ? "border-white/[0.10] bg-white/[0.02]"
          : success
          ? "border-emerald-500/40 bg-emerald-500/[0.04]"
          : "border-white/[0.10] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04]"
      }`}
    >
      <div className="px-8 py-10 text-center">
        {uploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Uploading…</p>
              <div className="w-48 mx-auto h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-slate-500">{progress}%</p>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-400">Upload complete!</p>
          </div>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-200 ${
              isDragging ? "bg-indigo-500/20 scale-110" : "bg-white/[0.04] scale-100"
            }`}>
              <svg
                className={`w-6 h-6 transition-colors ${isDragging ? "text-indigo-400" : "text-slate-500"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
            </div>
            <p className={`text-sm font-medium mb-1 transition-colors ${isDragging ? "text-indigo-300" : "text-slate-300"}`}>
              {isDragging ? "Drop it here" : "Drop a file or browse"}
            </p>
            <p className="text-xs text-slate-500 mb-4">PDF, PNG, JPEG · up to 10 MB</p>
            <label className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDragging
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700"
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Browse Files
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="px-5 pb-5 -mt-2 flex items-center gap-2 text-xs text-red-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
