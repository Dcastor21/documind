"use client";

import { useState, useCallback } from "react";
import { useDocuments }      from "@/hooks/useDocuments";
import { useDocumentDetail } from "@/hooks/useDocumentDetail";
import { Sidebar }           from "@/components/Sidebar";
import { LibraryView }       from "@/components/library/LibraryView";
import { ReaderView }        from "@/components/reader/ReaderView";
import { SearchView }        from "@/components/SearchView";
import { InsightsView }      from "@/components/InsightsView";
import { UploadModal }       from "@/components/UploadModal";
import { ToastList }         from "@/components/ui/ToastList";
import type { Document, View } from "@/types/documents";

export default function Dashboard() {
  const [view, setView]             = useState<View>("library");
  const [activeFolder, setActiveFolder] = useState("All Documents");
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    documents,
    loading,
    fetchError,
    fetchDocuments,
    toasts,
    dismissToast,
    starredIds,
    toggleStar,
  } = useDocuments();

  const {
    selected,
    detailLoading,
    previewDocument,
    fetchDetail,
  } = useDocumentDetail();

  // Navigate to the reader, immediately show partial data from the list,
  // then fetchDetail replaces it with the full record.
  const openDoc = useCallback((doc: Document) => {
    previewDocument(doc);
    fetchDetail(doc.documentId);
    setView("reader");
  }, [previewDocument, fetchDetail]);

  // Folder selection always navigates back to the library view
  const handleFolderSelect = useCallback((folder: string) => {
    setActiveFolder(folder);
    setView("library");
  }, []);

  const analyzedCount = documents.filter((d) => d.status === "completed").length;

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <Sidebar
        view={view}
        onViewChange={setView}
        activeFolder={activeFolder}
        onFolderSelect={handleFolderSelect}
        analyzedCount={analyzedCount}
        onUpload={() => setUploadOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view === "library" && (
          <LibraryView
            documents={documents}
            loading={loading}
            fetchError={fetchError}
            folder={activeFolder}
            onOpen={openDoc}
            onRetry={fetchDocuments}
            onUpload={() => setUploadOpen(true)}
            starredIds={starredIds}
            onToggleStar={toggleStar}
          />
        )}

        {view === "reader" && selected && (
          <ReaderView
            doc={selected}
            detailLoading={detailLoading}
            onBack={() => setView("library")}
          />
        )}

        {view === "search" && (
          <SearchView documents={documents} onOpen={openDoc} />
        )}

        {view === "insights" && (
          <InsightsView documents={documents} onOpen={openDoc} />
        )}
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={fetchDocuments}
      />

      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}