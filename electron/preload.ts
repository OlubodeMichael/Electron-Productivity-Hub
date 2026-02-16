import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  openFolder: (defaultPath?: string) => ipcRenderer.invoke("open-folder", defaultPath),
  getFolderChildren: (dirPath: string) => ipcRenderer.invoke("get-folder-children", dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  runCommand: (cmd: string, cwd: string) => ipcRenderer.invoke("run-command", cmd, cwd),
})
console.log("Preload is running")
