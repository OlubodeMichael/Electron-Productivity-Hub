"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    openFolder: (defaultPath) => electron_1.ipcRenderer.invoke("open-folder", defaultPath),
    getFolderChildren: (dirPath) => electron_1.ipcRenderer.invoke("get-folder-children", dirPath),
    readFile: (filePath) => electron_1.ipcRenderer.invoke("read-file", filePath),
    runCommand: (cmd, cwd) => electron_1.ipcRenderer.invoke("run-command", cmd, cwd),
    getHomeDir: () => electron_1.ipcRenderer.invoke("get-homedir"),
});
console.log("Preload is running");
//# sourceMappingURL=preload.js.map