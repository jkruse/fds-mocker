# FDS Mocker

An interactive browser-based tool for quickly prototyping UI with the [Danish Design System (DKFDS)](https://designsystem.dk/).

Paste any DKFDS component HTML into the left-hand editor and see it rendered live on the right — no setup, no server.

## Features

- **Live preview** — updates as you type (300 ms debounce)
- **Syntax-highlighted editor** — CodeMirror 6 with HTML language support
- **Automatic page shell** — your snippet is automatically wrapped in a full DKFDS page so CSS and JS are always loaded
- **Theme switcher** — toggle between the Virk.dk and Borger.dk stylesheets in the toolbar
- **Save & share** — the URL fragment is kept in sync with your markup (deflate-compressed, base64url-encoded). Bookmark the page to save your work, or click **🔗 Copy link** to share a mockup with others
- **Persistent state** — editor content and selected theme are also saved in `localStorage` and restored on reload
- **Resizable panes** — drag the divider to adjust the editor/preview split

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173/fds-mocker/](http://localhost:5173/fds-mocker/) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deployment

The app is automatically deployed to GitHub Pages on every push to `main` via the included GitHub Actions workflow (`.github/workflows/deploy.yml`).

**Live app:** [jkruse.github.io/fds-mocker](https://jkruse.github.io/fds-mocker/)

## Technology

| Concern | Choice |
|---|---|
| Framework | Vue 3 + Vite |
| Editor | CodeMirror 6 |
| Design system | [dkfds](https://www.npmjs.com/package/dkfds) (loaded from bundled assets) |
| Deployment | GitHub Pages via GitHub Actions |

## Tests

```bash
npm test           # run once
npm run test:watch # watch mode
npm run test:coverage
```

Vitest test suite covering all composables, utilities, and components (75+ tests).
