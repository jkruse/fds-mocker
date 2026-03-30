# FDS Mocker

An interactive browser-based tool for quickly prototyping UI with the [Danish Design System (DKFDS)](https://designsystem.dk/).

Paste any DKFDS component HTML into the left-hand editor and see it rendered live on the right — no setup, no server.

## Features

- **Live preview** — updates as you type (300 ms debounce)
- **Syntax-highlighted editor** — CodeMirror 6 with HTML language support
- **Automatic page shell** — your snippet is automatically wrapped in a full DKFDS page so CSS and JS are always loaded
- **Persistent state** — your editor content is saved in `localStorage` and restored on reload
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

The app is configured for **GitHub Pages**.

1. Push your repository to GitHub as `<your-username>/fds-mocker`.
2. In the repository settings, go to **Pages** and set the source to the `gh-pages` branch.
3. The included GitHub Actions workflow (`.github/workflows/deploy.yml`) will build and deploy automatically on every push to `main`.

The deployed URL will be:  
`https://<your-username>.github.io/fds-mocker/`

## Technology

| Concern | Choice |
|---|---|
| Framework | Vue 3 + Vite |
| Editor | CodeMirror 6 |
| Design system | [dkfds](https://www.npmjs.com/package/dkfds) (loaded from bundled assets) |
| Deployment | GitHub Pages via GitHub Actions |
