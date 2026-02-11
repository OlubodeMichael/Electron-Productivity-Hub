import { app, BrowserWindow } from "electron"
import fs from "fs"
import http from "http"
import path from "path"

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
    },
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
