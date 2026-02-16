"use client"

import { FileText } from "lucide-react"
import { useApp } from "@/app/contexts/AppContext"

export default function Home() {
  const {
    filePreview,
    selectedPath,
    loading,
  } = useApp()

  return (
    <>
      {!selectedPath && !filePreview && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="rounded-full bg-(--bg-elevated) p-6">
            <FileText className="w-12 h-12 text-(--text-muted)" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Dev Productivity Hub
            </h2>
            <p className="mt-1 max-w-sm text-sm text-(--text-secondary)">
              Open a folder in the sidebar, then click a file to view its contents here.
            </p>
          </div>
        </div>
      )}
      {(selectedPath || filePreview !== null) && (
        <div className="flex flex-1 flex-col min-h-0">
          {selectedPath && (
            <header className="shrink-0 border-b border-(--border) bg-(--bg-surface) px-4 py-2">
              <p
                className="truncate font-mono text-xs text-(--text-secondary)"
                title={selectedPath}
              >
                {selectedPath.replace(/^\/Users\/[^/]+/, "~")}
              </p>
            </header>
          )}
          <div className="flex flex-1 flex-col overflow-auto p-4 min-h-0 items-center">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-(--border) border-t-(--accent)" />
                Loading…
              </div>
            ) : filePreview !== null ? (
              filePreview.type === "text" ? (
                <pre className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word w-full">
                  {filePreview.content}
                </pre>
              ) : filePreview.mimeType.startsWith("image/") ? (
                <img
                  src={`data:${filePreview.mimeType};base64,${filePreview.data}`}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              ) : filePreview.mimeType === "application/pdf" ? (
                <iframe
                  title="PDF"
                  src={`data:${filePreview.mimeType};base64,${filePreview.data}`}
                  className="w-full flex-1 min-h-[600px] border-0 rounded"
                />
              ) : (
                <p className="text-(--text-muted)">
                  Preview not available for this file type.
                </p>
              )
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
