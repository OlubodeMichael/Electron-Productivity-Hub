"use client"

import { Folder as FolderIcon, ChevronRight, Loader2 } from "lucide-react"
import { useState } from "react"
import File from "./File"

interface TreeNode {
  name: string
  path: string
  type: "folder" | "file"
  children?: TreeNode[]
}

interface FolderProps {
  folder: string
  path: string
  depth: number
  childNodes?: TreeNode[]
  onOpenFolder: (path: string) => void
  onReadFile: (path: string) => void
}

export default function Folder({
  folder,
  path,
  depth,
  childNodes: initialChildNodes,
  onOpenFolder,
  onReadFile,
}: FolderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadedChildren, setLoadedChildren] = useState<TreeNode[] | null>(null)
  const [loading, setLoading] = useState(false)

  const hasInitial = initialChildNodes != null && initialChildNodes.length > 0
  const children = hasInitial ? initialChildNodes : (loadedChildren ?? [])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const willOpen = !isOpen
    setIsOpen(willOpen)
    if (
      willOpen &&
      !hasInitial &&
      loadedChildren === null &&
      typeof window.api.getFolderChildren === "function"
    ) {
      setLoading(true)
      window.api
        .getFolderChildren(path)
        .then((nodes) => setLoadedChildren(Array.isArray(nodes) ? nodes : []))
        .catch(() => setLoadedChildren([]))
        .finally(() => setLoading(false))
    }
  }

  const handleOpenHere = () => {
    onOpenFolder(path)
  }

  const indent = depth * 16

  return (
    <div className="select-none">
      <div
        role="button"
        tabIndex={0}
        className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer text-[13px] font-mono text-(--text-secondary) hover:bg-(--accent-muted) hover:text-foreground focus:outline-none focus:ring-1 focus:ring-(--accent) focus:ring-inset"
        style={{ paddingLeft: indent + 8 }}
        onClick={handleToggle}
        onDoubleClick={handleOpenHere}
      >
        <ChevronRight
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        <FolderIcon className="w-3.5 h-3.5 shrink-0 text-(--accent)" />
        <span className="truncate">{folder}</span>
      </div>
      {isOpen && (
        <div>
          {loading ? (
            <div
              className="flex items-center gap-1.5 py-1 px-2 text-(--text-muted) font-mono text-[13px]"
              style={{ paddingLeft: indent + 24 }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Loading…</span>
            </div>
          ) : (
            children.map((node, index) => {
              const subNodes = node.type === "folder" ? node.children : undefined
              return node.type === "folder" ? (
                <Folder
                  key={`${node.path}-${index}`}
                  folder={node.name}
                  path={node.path}
                  depth={depth + 1}
                  childNodes={subNodes}
                  onOpenFolder={onOpenFolder}
                  onReadFile={onReadFile}
                />
              ) : (
                <File
                  key={`${node.path}-${index}`}
                  file={node.name}
                  path={node.path}
                  depth={depth + 1}
                  onClick={() => onReadFile(node.path)}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
