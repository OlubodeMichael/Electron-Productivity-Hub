"use client"

import { useState } from "react"
import Folder from "@/components/ui/Folder"
import File from "@/components/ui/File"
import {  FileText } from "lucide-react"
import Sidebar from "@/components/ui/Sidebar"

export default function Home() {
  const [folder, setFolder] = useState<string | null>(null)
  const [tree, setTree] = useState<TreeNode[]>([])
  const [filePreview, setFilePreview] = useState<
    | { type: "text"; content: string }
    | { type: "binary"; mimeType: string; data: string }
    | null
  >(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleOpenFolder = async (defaultPath?: string | null) => {
    const data = await window.api.openFolder(defaultPath ?? undefined)
    if (!data) return
    setFolder(data.folderPath ?? null)
    setTree(Array.isArray(data.tree) ? data.tree : [])
    setFilePreview(null)
    setSelectedPath(null)
  }

  const handleReadFile = async (filePath: string) => {
    setLoading(true)
    setSelectedPath(filePath)
    try {
      const result = await window.api.readFile(filePath)
      setFilePreview(result)
    } catch {
      setFilePreview({ type: "text", content: "(Unable to read file)" })
    } finally {
      setLoading(false)
    }
  }

  const renderNode = (node: TreeNode, depth: number) => {
    if (node.type === "folder") {
      return (
        <Folder
          key={node.path}
          folder={node.name}
          path={node.path}
          depth={depth}
          childNodes={node.children}
          onOpenFolder={handleOpenFolder}
          onReadFile={handleReadFile}
        />
      )
    }
    return (
      <File
        key={node.path}
        file={node.name}
        path={node.path}
        depth={depth}
        onClick={() => handleReadFile(node.path)}
      />
    )
  }

  return (
    <div className="app-grain flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        folder={folder}
        tree={tree}
        onOpenFolder={handleOpenFolder}
        renderNode={renderNode}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col min-w-0 bg-background">
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
                <p className="truncate font-mono text-xs text-(--text-secondary)" title={selectedPath}>
                  {selectedPath.replace(/^\/Users\/[^/]+/, "~")}
                </p>
              </header>
            )}
            <div className="flex-1 overflow-auto p-4 min-h-0 flex flex-col items-center">
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
                  <p className="text-(--text-muted)">Preview not available for this file type.</p>
                )
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
