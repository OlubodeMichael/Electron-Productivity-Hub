# Electron Next App

A desktop application built with **Electron** and **Next.js**. The renderer is a Next.js app (React); the main process is a small Electron shell that loads it in a native window.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

## Installation

Clone the repo (or use it as a template), then install dependencies:

```bash
npm install
```

Build the Electron main process (TypeScript → JavaScript):

```bash
npm run build:electron
```

## Development

### Option 1: Single command (recommended)

Starts both the Next.js dev server and Electron together. The app window opens once the dev server is ready.

```bash
npm run dev
```

- Next.js runs at [http://localhost:3000](http://localhost:3000)
- Electron loads that URL in a desktop window
- Edits in `app/` hot-reload in the window

### Option 2: Two terminals

Useful if you want to run or debug Next and Electron separately.

1. **Terminal 1** – Next.js dev server:
   ```bash
   npx next dev
   ```
2. **Terminal 2** – Electron (after Next is up):
   ```bash
   npm run start
   ```

If `out/index.html` doesn’t exist (no production build yet), Electron will load `http://localhost:3000` automatically.

## Building for production

1. **Export Next.js** (static output to `out/`):
   ```bash
   npm run build
   ```
2. **Build the Electron main process** (if you changed `electron/main.ts`):
   ```bash
   npm run build:electron
   ```
3. **Run the app** (loads from `out/index.html`):
   ```bash
   npm run start
   ```

For distributable installers (e.g. `.dmg`, `.exe`), use [electron-builder](https://www.electron.build/) or [electron-packager](https://github.com/electron/electron-packager) and point them at `dist-electron/main.js` as the main entry and `out/` as the static files.

## Project structure

```
├── app/                 # Next.js App Router (pages, layout, styles)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── electron/             # Electron main process (source)
│   ├── main.ts           # Main process entry
│   └── tsconfig.json     # TypeScript config for Electron
├── dist-electron/        # Compiled main process (main.js) — do not edit
├── out/                  # Next.js static export (after npm run build)
├── public/               # Next.js static assets
├── next.config.ts
├── package.json
└── README.md
```

- **`electron/main.ts`** – Creates the BrowserWindow, waits for the dev server in development, and loads either `http://localhost:3000` (dev) or `out/index.html` (production).
- **`app/`** – Your Next.js app; edit here for UI and routing.
- **`dist-electron/`** – Generated from `electron/` by `npm run build:electron`; ignored by ESLint.

## Scripts

| Script              | Description |
|---------------------|-------------|
| `npm run dev`       | Start Next.js dev server and Electron (dev mode). |
| `npm run build`     | Build Next.js and export static site to `out/`. |
| `npm run build:electron` | Compile `electron/main.ts` → `dist-electron/main.js`. |
| `npm run start`     | Run Electron; loads `out/index.html` if present, else `http://localhost:3000`. |
| `npm run lint`      | Run ESLint. |

## Tech stack

- **Electron** 40 – Desktop shell
- **Next.js** 16 – React framework and dev server
- **React** 19
- **TypeScript** 5
- **Tailwind CSS** 4 – Styling

## Notes

- **No `@types/electron`** – Electron 40+ ships its own TypeScript types; the DefinitelyTyped package is not used.
- **Static export** – Production runs from the static export in `out/`; ensure `next build` / `next export` (or `output: 'export'` in `next.config`) is used so `out/index.html` exists before `npm run start` for production.
- **macOS** – On “window-all-closed”, the app does not quit on macOS so it behaves like a typical Mac app (dock icon stays until quit).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Electron + Next.js](https://www.electronjs.org/docs/latest/tutorial/application-distribution) (distribution)
