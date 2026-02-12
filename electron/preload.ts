import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  openFolder: (defaultPath?: string) => ipcRenderer.invoke("open-folder", defaultPath),
  getFolderChildren: (dirPath: string) => ipcRenderer.invoke("get-folder-children", dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  runCommand: (cmd: string) => ipcRenderer.invoke("run-command", cmd),
})
console.log("Preload is running")
