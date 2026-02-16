import { FolderOpen, PanelLeftClose, PanelLeftOpen, Terminal } from "lucide-react"
import Button from "../ui/Button"

const SIDEBAR_WIDTH_CLOSED = 48
const SIDEBAR_WIDTH_OPEN_DEFAULT = 288 // w-72

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: string | null
  tree: TreeNode[]
  onOpenFolder: (path?: string | null) => void
  onOpenTerminal?: () => void
  renderNode: (node: TreeNode, depth: number) => React.ReactNode
  /** When open, use this width so the sidebar can be resized; otherwise uses default. */
  width?: number
}

export default function Sidebar({
  open: sidebarOpen,
  onOpenChange,
  folder,
  tree,
  onOpenFolder: handleOpenFolder,
  onOpenTerminal: handleOpenTerminal,
  renderNode,
  width,
}: SidebarProps) {
  const displayPath = folder ? folder.replace(/^\/Users\/[^/]+/, "~") : null
  const openWidth = width ?? SIDEBAR_WIDTH_OPEN_DEFAULT
  return (
    <aside
      className="flex shrink-0 flex-col border-r border-(--border) bg-(--bg-surface) transition-[width] cursor-ew-resize duration-200 ease-out"
      style={{
        width: sidebarOpen ? openWidth : SIDEBAR_WIDTH_CLOSED,
        minWidth: sidebarOpen ? undefined : SIDEBAR_WIDTH_CLOSED,
      }}
    >
        {sidebarOpen ? (
          <>
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-(--border) px-2">
              <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
                Explorer
              </h1>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                aria-label="Close sidebar"
                className="shrink-0 px-2"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
            <div className="shrink-0 border-b border-(--border) p-2">
              <div className="flex flex-col gap-0.5">
                <Button
                  onClick={() => handleOpenFolder(folder ?? undefined)}
                  variant="ghost"
                  className="justify-start gap-2 px-2 py-1.5 text-sm"
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  Open folder
                </Button>
                <Button
                  onClick={handleOpenTerminal}
                  variant="ghost"
                  className="justify-start gap-2 px-2 py-1.5 text-sm"
                  aria-label="Open terminal"
                >
                  <Terminal className="w-4 h-4 shrink-0" />
                  Terminal
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-start pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(true)}
              aria-label="Open sidebar"
              className="h-10 min-h-10 w-10 min-w-10 p-0"
            >
              <PanelLeftOpen className="h-5 w-5 shrink-0 text-foreground" />
            </Button>
          </div>
        )}
        {sidebarOpen && (
        <div className="flex-1 overflow-y-auto p-2">
          {folder && (
            <p className="mb-2 truncate px-2 py-1 text-xs text-(--text-muted)" title={folder}>
              {displayPath}
            </p>
          )}
          {tree.length === 0 && !folder && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
              <div className="rounded-full bg-(--accent-muted) p-4">
                <FolderOpen className="w-8 h-8 text-(--accent)" />
              </div>
              <p className="text-sm text-(--text-secondary)">
                No folder open. Click &quot;Open folder&quot; to browse your project.
              </p>
              <Button onClick={() => handleOpenFolder(null)}>Open folder</Button>
            </div>
          )}
          {tree.length === 0 && folder && (
            <p className="px-2 py-4 text-xs text-(--text-muted)">Empty folder.</p>
          )}
          {tree.length > 0 && (
            <div className="space-y-0">
              {tree.map((node, index) => (
                <div
                  key={`${node.path}-${index}`}
                  style={{
                    animationDelay: `${index * 20}ms`,
                  }}
                >
                  {renderNode(node, 0)}
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </aside>
    )
}