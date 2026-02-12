import { app, BrowserWindow, ipcMain, dialog } from "electron"
import fs from "fs"
import http from "http"
import path from "path"
import mammoth from "mammoth"

interface TreeNode {
  name: string
  path: string
  type: "folder" | "file"
  children?: TreeNode[]
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "__pycache__", ".venv", "venv"])

function getDirectChildren(dirPath: string): TreeNode[] {
  const items = fs.readdirSync(dirPath)
  return items
    .filter((item) => !SKIP_DIRS.has(item))
    .map((item) => {
      const fullPath = path.join(dirPath, item)
      const stats = fs.lstatSync(fullPath)
      if (stats.isDirectory()) {
        return { name: item, path: fullPath, type: "folder" as const }
      }
      return { name: item, path: fullPath, type: "file" as const }
    })
}

let mainWindow: BrowserWindow | null = null

const DEV_URL = "http://localhost:3000"

const waitForDevServer = (): Promise<void> => {
  return new Promise((resolve) => {
    const tryConnect = () => {
      const req = http.get(DEV_URL, () => resolve())
      req.on("error", () => setTimeout(tryConnect, 200))
      req.end()
    }
    tryConnect()
  })
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  ipcMain.handle("open-folder", async (_, defaultPath?: string) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      defaultPath: defaultPath || undefined,
      properties: ["openDirectory"],
    })
    if (result.canceled) return null
    const folderPath = result.filePaths[0]
    const tree = getDirectChildren(folderPath)
    return { folderPath, tree }
  })

  ipcMain.handle("get-folder-children", async (_, dirPath: string) => {
    return getDirectChildren(dirPath)
  })

  const BINARY_EXTENSIONS: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    ico: "image/x-icon",
    svg: "image/svg+xml",
    tiff: "image/tiff",
    tif: "image/tiff",
  }
  const MAX_BINARY_SIZE = 50 * 1024 * 1024 // 50MB

  const DOCX_EXTENSIONS = new Set(["docx", "doc"])

  ipcMain.handle("read-file", async (_, filePath: string) => {
    const ext = path.extname(filePath).toLowerCase().slice(1)
    if (DOCX_EXTENSIONS.has(ext)) {
      const stats = fs.statSync(filePath)
      if (stats.size > MAX_BINARY_SIZE) {
        throw new Error("File too large to display")
      }
      const buffer = fs.readFileSync(filePath)
      const result = await mammoth.extractRawText({ buffer })
      return { type: "text" as const, content: result.value }
    }
    const mimeType = BINARY_EXTENSIONS[ext]
    if (mimeType) {
      const stats = fs.statSync(filePath)
      if (stats.size > MAX_BINARY_SIZE) {
        throw new Error("File too large to display")
      }
      const buffer = fs.readFileSync(filePath)
      return { type: "binary" as const, mimeType, data: buffer.toString("base64") }
    }
    return {
      type: "text" as const,
      content: fs.readFileSync(filePath, "utf8"),
    }
  })
  

  const isDev = process.env.ELECTRON_DEV === "1" || process.env.NODE_ENV === "development"
  const outPath = path.join(__dirname, "../out/index.html")
  const hasBuiltApp = fs.existsSync(outPath)

  if (isDev || !hasBuiltApp) {
    // Dev mode or no build yet: load Next dev server
    waitForDevServer().then(() => {
      mainWindow?.loadURL(DEV_URL)
    })
  } else {
    mainWindow.loadFile(outPath)
  }
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
