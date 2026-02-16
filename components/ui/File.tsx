"use client"

import { File as FileIcon } from "lucide-react"

interface FileProps {
  file: string
  path: string
  depth: number
  onClick?: () => void
}

export default function File({ file, path, depth, onClick }: FileProps) {
  const indent = depth * 16

  return (
    <div
      role="button"
      tabIndex={0}
      title={path}
      className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer text-[13px] font-mono text-(--text-secondary) hover:bg-(--accent-muted) hover:text-foreground focus:outline-none focus:ring-1 focus:ring-(--accent) focus:ring-inset"
      style={{ paddingLeft: indent + 8 }}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <FileIcon className="w-3.5 h-3.5 shrink-0 text-(--text-muted)" />
      <span className="truncate">{file}</span>
    </div>
  )
}
