export {}

declare global {
  interface Window {
    api: {
      preloadRan?: boolean
      openFolder: (defaultPath?: string) => Promise<{
        folderPath: string
        tree: TreeNode[]
      } | null>
      getFolderChildren: (dirPath: string) => Promise<TreeNode[]>
      readFile: (
        filePath: string
      ) => Promise<
        | { type: "text"; content: string }
        | { type: "binary"; mimeType: string; data: string }
      >
      runCommand: (cmd: string, cwd: string) => Promise<string>
      
    }
  }
  interface TreeNode {
    name: string
    path: string
    type: "folder" | "file"
    children?: TreeNode[]
  }
}

export interface Line {
  type: "command" | "output"
  text: string
}