# ⏳ Time Tracker

A fast, minimal desktop time tracking app built with [Electrobun](https://electrobun.dev) — powered by Bun, React, Tailwind CSS, Vite, and SQLite.

![Time Tracker Screenshot](docs/screenshot.png)

---

## Features

- **Activity tiles** — Create colour-coded, emoji-tagged activity buttons. One click starts tracking; another stops it.
- **Only one timer at a time** — Starting a new activity automatically stops the previous one.
- **Live elapsed timer** — Each running tile shows a live HH:MM:SS counter while tracking.
- **Session history** — Browse all recorded sessions grouped by day, with filters (Today / This Week / All).
- **Total tracked time** — Summary time shown in the History view for the active filter range.
- **Settings panel** — Add, edit, delete, and reorder activities with a colour + emoji picker.
- **SQLite persistence** — All data is stored locally in a SQLite database (`%APPDATA%\TimeTracker\timetracker.db` on Windows).
- **Hot Module Replacement** — Full Vite HMR during development for instant UI updates.
- **Small footprint** — Uses the system WebView2 (Windows) instead of bundling Chromium (~14 MB total).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | [Electrobun](https://electrobun.dev) v1.18 |
| Main process runtime | [Bun](https://bun.sh) |
| Database | SQLite via `bun:sqlite` |
| UI framework | [React](https://react.dev) 19 |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Bundler / Dev server | [Vite](https://vitejs.dev) 8 |
| Language | TypeScript 6 |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Windows 11 (WebView2 is pre-installed)
- Node.js is **not** required

### Install dependencies

```bash
bun install
```

---

## Development

### Standard dev mode (no HMR)

Builds the Vite bundle once, then launches the Electrobun app with file-watch rebuilds:

```bash
bun run dev
```

### Dev mode with Hot Module Replacement

Runs the Vite dev server in parallel so edits to React components refresh instantly without restarting the app:

```bash
bun run dev:hmr
```

This starts:
1. `vite --port 5173` — Vite dev server with HMR
2. `vite build && electrobun dev` — initial build + Electrobun launcher

The app detects the Vite dev server at startup and loads from `http://localhost:5173` instead of the bundled files.

---

## Building

### Development build (flat files)

```bash
bun run start
```

Builds the Vite bundle and launches the Electrobun dev build.

### Canary release build

```bash
bun run build:canary
```

Produces a self-extracting installer in `artifacts/`.

---

## Project Structure

```
time-tracker/
├── src/
│   ├── bun/
│   │   ├── index.ts        ← Main process: window + RPC handlers
│   │   ├── db.ts           ← SQLite database layer (Bun.sqlite)
│   │   └── rpc.ts          ← Shared typed RPC schema
│   └── mainview/
│       ├── main.tsx         ← React entry point
│       ├── App.tsx          ← Root component & view router
│       ├── index.css        ← Tailwind + custom animations
│       ├── index.html       ← HTML template
│       ├── lib/
│       │   └── rpc.ts       ← Browser-side RPC client (Electroview)
│       └── components/
│           ├── Header.tsx       ← Top navigation bar
│           ├── TileGrid.tsx     ← Responsive activity tile grid
│           ├── Tile.tsx         ← Individual tile with live timer
│           ├── HistoryPanel.tsx ← Session history with filters
│           ├── OptionsPanel.tsx ← Activity management panel
│           └── TileForm.tsx     ← Add/edit activity form
├── electrobun.config.ts    ← Electrobun build configuration
├── vite.config.ts          ← Vite configuration
├── package.json
└── tsconfig.json
```

---

## Data Storage

Sessions and activities are stored in a local SQLite database:

- **Windows:** `%APPDATA%\TimeTracker\timetracker.db`
- **macOS:** `~/Library/Application Support/TimeTracker/timetracker.db`
- **Linux:** `~/.config/TimeTracker/timetracker.db`

### Schema

#### `activities`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Display name |
| `color` | TEXT | Hex color string |
| `icon` | TEXT | Emoji icon |
| `position` | INTEGER | Sort order |
| `created_at` | TEXT | ISO timestamp |

#### `sessions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `activity_id` | INTEGER | FK → activities |
| `started_at` | TEXT | ISO timestamp |
| `ended_at` | TEXT | ISO timestamp (null = currently running) |
| `notes` | TEXT | Optional notes |

---

## RPC Architecture

Electrobun uses a typed RPC system for communication between the Bun main process and the React webview. The schema is defined in [`src/bun/rpc.ts`](src/bun/rpc.ts) and shared across both sides.

```
React UI (WebView2)
     │  rpc.request("startSession", { activityId: 1 })
     ▼
WebSocket (ws://localhost:PORT)
     │  encrypted AES-GCM
     ▼
Bun Process
     │  handler: ({ activityId }) => db.startSession(activityId)
     ▼
SQLite (bun:sqlite)
```

All RPC calls are fully typed end-to-end — TypeScript will catch mismatches between what the UI calls and what the Bun process handles.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|---------|
| *(planned)* | — |

---

## Contributing

PRs and issues welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request with a clear description

---

## License

MIT — see [LICENSE](LICENSE) for details.
