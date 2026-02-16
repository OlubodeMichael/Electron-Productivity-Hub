# Dev Productivity Hub

A desktop app built with **Electron** and **Next.js** for browsing folders, viewing files, and running commands in an integrated terminal. The UI is a Next.js (React) app; Electron provides the native window and Node.js APIs (file system, shell).

## Features

- **File explorer** – Open a folder from the sidebar; tree view with expandable folders and files. Last opened folder and tree persist in `localStorage`.
- **File preview** – Click a file to view it in the main area:
  - **Text** – Plain text, UTF-8
  - **Images** – PNG, JPEG, GIF, WebP, BMP, ICO, SVG, TIFF
  - **PDF** – Rendered with PDF.js (canvas-based; works in Electron)
  - **Video** – MP4, WebM, OGG, MOV, M4V (native `<video>` with controls)
  - **DOCX** – Extracted as plain text via `mammoth`
- **Integrated terminal** – Toggle from the sidebar. Runs commands in the current working directory (or home if no folder is open). **`cd`** changes the prompt and pwd; other commands run in the shell. Resizable height; can be placed at the bottom of the main content.
- **Resizable UI** – Sidebar width (when open) and terminal panel height are draggable within min/max bounds.
- **Dashboard** – Route at `/dashboard` with a terminal option that opens in a modal (ease-in from bottom).

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

## Installation

Clone the repo, then install dependencies:

```bash
npm install
```

Build the Electron main process (TypeScript → JavaScript):

```bash
npm run build:electron
```

## Development

### Single command (recommended)

Starts the Next.js dev server and Electron together. The app window opens when the dev server is ready.

```bash
npm run dev
```

- Next.js runs at [http://localhost:3000](http://localhost:3000)
- Electron loads that URL in a desktop window
- Edits in `app/` and `components/` hot-reload in the window

### Two terminals

1. **Terminal 1** – Next.js:
   ```bash
   npx next dev
   ```
2. **Terminal 2** – Electron (after Next is up):
   ```bash
   npm run start
   ```

If `out/index.html` doesn’t exist, Electron falls back to `http://localhost:3000`.

## Building for production

1. Export Next.js to `out/`:
   ```bash
   npm run build
   ```
2. Build the Electron main process (if you changed `electron/`):
   ```bash
   npm run build:electron
   ```
3. Run the app (loads from `out/index.html`):
   ```bash
   npm run start
   ```

For distributable installers (e.g. `.dmg`, `.exe`), use [electron-builder](https://www.electron.build/) or [electron-packager](https://github.com/electron/electron-packager), with `dist-electron/main.js` as main entry and `out/` as static files.

## Project structure

```
├── app/
│   ├── layout.tsx          # Root layout; AppProvider + AppShell
│   ├── page.tsx             # Home: file explorer + preview (text, image, PDF, video)
│   ├── dashboard/           # Dashboard page (terminal modal, etc.)
│   ├── contexts/
│   │   └── AppContext.tsx   # Global state (folder, tree, filePreview, terminal, sidebar)
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     # Sidebar + main + terminal; resize handles
│   │   └── Sidebar.tsx      # Explorer tree, Open folder, Terminal toggle
│   ├── terminal/
│   │   └── terminal.tsx     # Terminal UI; cd/pwd, runCommand via IPC
│   ├── PdfViewer.tsx        # PDF.js-based PDF renderer (canvas)
│   └── ui/                  # Button, File, Folder, Modal
├── electron/
│   ├── main.ts              # Window, IPC (open-folder, read-file, run-command, resolve-path, get-homedir), CSP
│   └── preload.ts           # contextBridge: api.openFolder, readFile, runCommand, resolvePath, getHomeDir
├── utils/
│   └── resize.ts            # resizeVertical, resizeHorizontal (drag to resize)
├── types/
│   └── electron.d.ts        # Window.api types, TreeNode
├── dist-electron/           # Compiled main process (main.js)
├── out/                     # Next.js static export (after build)
└── package.json
```

- **`electron/main.ts`** – Creates the window, sets CSP (frame-src, media-src for PDF/video), implements IPC handlers for folder picker, file read (binary/text/docx), shell commands, path resolution for `cd`, and home directory.
- **`app/contexts/AppContext.tsx`** – Holds folder, tree, filePreview, sidebar/terminal state; persists folder/tree to `localStorage` and restores on load.
- **`components/layout/AppShell.tsx`** – Renders Sidebar (with resize grip), main content area, and bottom terminal panel (with resize); uses `useApp()` and resize helpers.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server + Electron (single command). |
| `npm run build` | Next.js build and static export to `out/`. |
| `npm run build:electron` | Compile `electron/main.ts` → `dist-electron/main.js`. |
| `npm run start` | Run Electron; loads `out/` if present, else dev server URL. |
| `npm run lint` | Run ESLint. |

## Tech stack

- **Electron** 40 – Desktop shell, IPC, file system, shell
- **Next.js** 16 – React app, routing, dev server
- **React** 19
- **TypeScript** 5
- **Tailwind CSS** 4 – Styling
- **pdfjs-dist** – PDF rendering in the renderer
- **mammoth** – DOCX to text (main process)
- **lucide-react** – Icons

## Notes

- **CSP** – Content Security Policy in `main.ts` allows `data:` and `blob:` for images, media, and frames so file previews (PDF, video) work.
- **macOS** – On “window-all-closed”, the app does not quit (dock icon remains until Quit).
- **Static export** – Production uses the Next.js static export in `out/`; ensure `npm run build` completes before `npm run start` for a production-style run.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [PDF.js](https://mozilla.github.io/pdf.js/)
