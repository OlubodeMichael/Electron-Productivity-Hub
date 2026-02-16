import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  openFolder: (defaultPath?: string) => ipcRenderer.invoke("open-folder", defaultPath),
  getFolderChildren: (dirPath: string) => ipcRenderer.invoke("get-folder-children", dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  runCommand: (cmd: string, cwd: string) => ipcRenderer.invoke("run-command", cmd, cwd),
  getHomeDir: () => ipcRenderer.invoke("get-homedir"),
  resolvePath: (cwd: string, segment: string) => ipcRenderer.invoke("resolve-path", cwd, segment),
})
console.log("Preload is running")
