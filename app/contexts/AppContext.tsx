"use client"

import Folder from "@/components/ui/Folder"
import File from "@/components/ui/File"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const FOLDER_STORAGE_KEY = "app-folder"
const TREE_STORAGE_KEY = "app-tree"

function getStoredFolder(): string | null {
  if (typeof window === "undefined") return null
  const s = localStorage.getItem(FOLDER_STORAGE_KEY)
  return s || null
}

function getStoredTree(): TreeNode[] {
  if (typeof window === "undefined") return []
  try {
    const s = localStorage.getItem(TREE_STORAGE_KEY)
    if (!s) return []
    const parsed = JSON.parse(s) as TreeNode[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

type FilePreview =
  | { type: "text"; content: string }
  | { type: "binary"; mimeType: string; data: string }
  | null

interface AppContextValue {
  folder: string | null
  tree: TreeNode[]
  filePreview: FilePreview
  setFilePreview: (v: FilePreview) => void
  selectedPath: string | null
  loading: boolean
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  terminalOpen: boolean
  setTerminalOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  handleOpenFolder: (defaultPath?: string | null) => Promise<void>
  handleReadFile: (filePath: string) => Promise<void>
  handleRunCommand: (cmd: string, cwd: string) => Promise<void>
  renderNode: (node: TreeNode, depth: number) => ReactNode
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [folder, setFolder] = useState<string | null>(null)
  const [tree, setTree] = useState<TreeNode[]>([])
  const [filePreview, setFilePreview] = useState<FilePreview>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(false)

  useEffect(() => {
    setFolder(getStoredFolder())
    setTree(getStoredTree())
  }, [])

  const handleOpenFolder = useCallback(async (defaultPath?: string | null) => {
    const data = await window.api.openFolder(defaultPath ?? undefined)
    if (!data) return
    const folderPath = data.folderPath ?? null
    const nextTree = Array.isArray(data.tree) ? data.tree : []
    setFolder(folderPath)
    setTree(nextTree)
    setFilePreview(null)
    setSelectedPath(null)
    if (typeof window !== "undefined") {
      localStorage.setItem(FOLDER_STORAGE_KEY, folderPath ?? "")
      localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(nextTree))
    }
  }, [])

  const handleReadFile = useCallback(async (filePath: string) => {
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
  }, [])

  const handleRunCommand = useCallback(
    async (cmd: string, cwd: string) => {
      await window.api.runCommand(cmd, cwd)
    },
    []
  )

  const renderNode = useCallback(
    (node: TreeNode, depth: number) => {
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
    },
    [handleOpenFolder, handleReadFile]
  )

  const value = useMemo<AppContextValue>(
    () => ({
      folder,
      tree,
      filePreview,
      setFilePreview,
      selectedPath,
      loading,
      sidebarOpen,
      setSidebarOpen,
      terminalOpen,
      setTerminalOpen,
      handleOpenFolder,
      handleReadFile,
      handleRunCommand,
      renderNode,
    }),
    [
      folder,
      tree,
      filePreview,
      selectedPath,
      loading,
      sidebarOpen,
      terminalOpen,
      handleOpenFolder,
      handleReadFile,
      handleRunCommand,
      renderNode,
    ]
  )

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
