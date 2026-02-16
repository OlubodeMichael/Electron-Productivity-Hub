"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const child_process_1 = require("child_process");
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "__pycache__", ".venv", "venv"]);
function getDirectChildren(dirPath) {
    const items = fs_1.default.readdirSync(dirPath);
    return items
        .filter((item) => !SKIP_DIRS.has(item))
        .map((item) => {
        const fullPath = path_1.default.join(dirPath, item);
        const stats = fs_1.default.lstatSync(fullPath);
        if (stats.isDirectory()) {
            return { name: item, path: fullPath, type: "folder" };
        }
        return { name: item, path: fullPath, type: "file" };
    });
}
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
    const isDev = process.env.ELECTRON_DEV === "1" || process.env.NODE_ENV === "development";
    // Content-Security-Policy: strict in production, allow HMR in dev
    const ses = electron_1.session.defaultSession;
    ses.webRequest.onHeadersReceived((details, callback) => {
        const csp = isDev
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; frame-src 'self' data: blob:; connect-src 'self' ws: wss: http://localhost:* https://localhost:*; font-src 'self'; base-uri 'self'"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; frame-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'self'";
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": [csp],
            },
        });
    });
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 1000,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, "preload.js"),
        },
    });
    electron_1.ipcMain.handle("open-folder", async (_, defaultPath) => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            defaultPath: defaultPath || undefined,
            properties: ["openDirectory"],
        });
        if (result.canceled)
            return null;
        const folderPath = result.filePaths[0];
        const tree = getDirectChildren(folderPath);
        return { folderPath, tree };
    });
    electron_1.ipcMain.handle("get-folder-children", async (_, dirPath) => {
        return getDirectChildren(dirPath);
    });
    electron_1.ipcMain.handle("get-homedir", () => os_1.default.homedir());
    electron_1.ipcMain.handle("resolve-path", (_, cwd, segment) => {
        const base = cwd === "~" ? os_1.default.homedir() : cwd;
        const seg = segment.trim();
        if (seg === "" || seg === "~")
            return os_1.default.homedir();
        const expanded = seg.startsWith("~")
            ? path_1.default.join(os_1.default.homedir(), seg.slice(1).replace(/^\//, "") || ".")
            : seg;
        const resolved = path_1.default.isAbsolute(expanded)
            ? path_1.default.normalize(expanded)
            : path_1.default.resolve(base, expanded);
        if (!fs_1.default.existsSync(resolved)) {
            throw new Error(`No such file or directory: ${segment || "~"}`);
        }
        if (!fs_1.default.statSync(resolved).isDirectory()) {
            throw new Error(`Not a directory: ${segment || "~"}`);
        }
        return resolved;
    });
    electron_1.ipcMain.handle("run-command", async (_, cmd, cwd) => {
        const workDir = cwd === "~" ? os_1.default.homedir() : cwd;
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(cmd, { cwd: workDir }, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                    return;
                }
                resolve(stdout);
            });
        });
    });
    const BINARY_EXTENSIONS = {
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
    };
    const MAX_BINARY_SIZE = 50 * 1024 * 1024; // 50MB
    const DOCX_EXTENSIONS = new Set(["docx", "doc"]);
    electron_1.ipcMain.handle("read-file", async (_, filePath) => {
        const ext = path_1.default.extname(filePath).toLowerCase().slice(1);
        if (DOCX_EXTENSIONS.has(ext)) {
            const stats = fs_1.default.statSync(filePath);
            if (stats.size > MAX_BINARY_SIZE) {
                throw new Error("File too large to display");
            }
            const buffer = fs_1.default.readFileSync(filePath);
            const result = await mammoth_1.default.extractRawText({ buffer });
            return { type: "text", content: result.value };
        }
        const mimeType = BINARY_EXTENSIONS[ext];
        if (mimeType) {
            const stats = fs_1.default.statSync(filePath);
            if (stats.size > MAX_BINARY_SIZE) {
                throw new Error("File too large to display");
            }
            const buffer = fs_1.default.readFileSync(filePath);
            return { type: "binary", mimeType, data: buffer.toString("base64") };
        }
        return {
            type: "text",
            content: fs_1.default.readFileSync(filePath, "utf8"),
        };
    });
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
//# sourceMappingURL=main.js.map