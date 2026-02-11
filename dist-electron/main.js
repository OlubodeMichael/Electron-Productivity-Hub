"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
let mainWindow = null;
const DEV_URL = "http://localhost:3000";
const waitForDevServer = () => {
    return new Promise((resolve) => {
        const tryConnect = () => {
            const req = http_1.default.get(DEV_URL, () => resolve());
            req.on("error", () => setTimeout(tryConnect, 200));
            req.end();
        };
        tryConnect();
    });
};
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    const isDev = process.env.ELECTRON_DEV === "1" || process.env.NODE_ENV === "development";
    const outPath = path_1.default.join(__dirname, "../out/index.html");
    const hasBuiltApp = fs_1.default.existsSync(outPath);
    if (isDev || !hasBuiltApp) {
        // Dev mode or no build yet: load Next dev server
        waitForDevServer().then(() => {
            mainWindow?.loadURL(DEV_URL);
        });
    }
    else {
        mainWindow.loadFile(outPath);
    }
};
electron_1.app.whenReady().then(createWindow);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
