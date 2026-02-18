import { app, BrowserWindow, ipcMain, dialog, session, protocol } from "electron"
import fs from "fs"
import http from "http"
import os from "os"
import path from "path"
import mammoth from "mammoth"
import { exec } from "child_process"

// Custom protocol so the app runs with a real origin (app://local) and scripts work.
// Must run before app.ready().
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
])

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
  const isDev = process.env.ELECTRON_DEV === "1" || process.env.NODE_ENV === "development"

  // Content-Security-Policy: strict in production, allow HMR in dev
  const ses = session.defaultSession
  ses.webRequest.onHeadersReceived((details, callback) => {
    const isAppProtocol = details.url.startsWith("app://")
    const csp =
      isDev || isAppProtocol
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; frame-src 'self' data: blob:; connect-src 'self' ws: wss: http://localhost:* https://localhost:*; font-src 'self'; base-uri 'self'"
        : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; frame-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'self'"
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    })
  })

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
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

  ipcMain.handle("get-homedir", () => os.homedir())

  ipcMain.handle("resolve-path", (_, cwd: string, segment: string) => {
    const base = cwd === "~" ? os.homedir() : cwd
    const seg = segment.trim()
    if (seg === "" || seg === "~") return os.homedir()
    const expanded = seg.startsWith("~")
      ? path.join(os.homedir(), seg.slice(1).replace(/^\//, "") || ".")
      : seg
    const resolved = path.isAbsolute(expanded)
      ? path.normalize(expanded)
      : path.resolve(base, expanded)
    if (!fs.existsSync(resolved)) {
      throw new Error(`No such file or directory: ${segment || "~"}`)
    }
    if (!fs.statSync(resolved).isDirectory()) {
      throw new Error(`Not a directory: ${segment || "~"}`)
    }
    return resolved
  })

  ipcMain.handle("run-command", async (_, cmd: string, cwd: string) => {
    const workDir = cwd === "~" ? os.homedir() : cwd
    return new Promise((resolve, reject) => {
      exec(
        cmd,
        { cwd: workDir },
        (error, stdout, stderr) => {
          if (error) {
            reject(stderr || error.message)
            return
          }
          resolve(stdout)
        }
      )
    })
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
    // video
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
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
  

  const outDir = path.join(__dirname, "../out")
  const outIndexPath = path.join(outDir, "index.html")
  const hasBuiltApp = fs.existsSync(outIndexPath)

  if (isDev || !hasBuiltApp) {
    // Dev mode or no build yet: load Next dev server
    waitForDevServer().then(() => {
      mainWindow?.loadURL(DEV_URL)
    })
  } else {
    // Serve static export via app:// so scripts run and app is interactive
    protocol.handle("app", (request) => {
      const reqUrl = new URL(request.url)
      if (reqUrl.host !== "local") {
        return new Response("Forbidden", { status: 403 })
      }
      let seg = reqUrl.pathname.replace(/^\//, "").trim() || "index.html"
      // Route paths to HTML files (Next static export)
      if (!path.extname(seg)) {
        if (seg === "index" || seg === "") seg = "index.html"
        else if (fs.existsSync(path.join(outDir, `${seg}.html`))) seg = `${seg}.html`
        else seg = "index.html"
      }
      const filePath = path.resolve(outDir, seg)
      const outDirResolved = path.resolve(outDir)
      if (!filePath.startsWith(outDirResolved + path.sep) && filePath !== outDirResolved) {
        return new Response("Forbidden", { status: 403 })
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return new Response("Not Found", { status: 404 })
      }
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mime: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ico": "image/x-icon",
      }
      const headers: Record<string, string> = {
        "Content-Type": mime[ext] ?? "application/octet-stream",
      }
      if (ext === ".html") {
        // Next.js static export uses inline scripts for hydration; allow them (we serve our own HTML).
        headers["Content-Security-Policy"] =
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; frame-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'self'"
      }
      return new Response(data, { headers })
    })
    mainWindow.loadURL("app://local/")
  }
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
