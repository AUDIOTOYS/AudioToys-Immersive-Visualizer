# Copilot Instructions — AudioToys Immersive Speaker Visualizer

You are helping convert a ChatGPT canvas React component into a standalone downloadable HTML app.

## Goal

Create a Vite React project that builds into a single self-contained `dist/index.html` file.

The final file must:
- open directly in a browser
- preserve the full AudioToys Immersive Speaker Visualizer UI
- include all CSS and JavaScript inline through Vite single-file build
- support PDF export using jsPDF
- support the existing interactive SVG 3D layout
- keep the coverage visualizer, DBAP tools, room modes, JSON import, and coordinate export

## Required output

After running:

```bash
npm install
npm run build
```

the app must produce:

```txt
dist/index.html
```

This file should be copyable and shareable as a standalone HTML file.

## Project structure

Use this structure:

```txt
AudioToys-Immersive-Visualizer/
├─ package.json
├─ index.html
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ README.md
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ index.css
   └─ components/
      └─ ui/
         ├─ card.jsx
         └─ button.jsx
```

## Important conversion rules

1. Do not depend on shadcn/ui.
2. Replace `@/components/ui/card` with the local file:
   `src/components/ui/card.jsx`
3. Replace `@/components/ui/button` with the local file:
   `src/components/ui/button.jsx`
4. Keep Tailwind classes as-is.
5. Use Vite + Tailwind to compile CSS.
6. Use `vite-plugin-singlefile` so JS and CSS are bundled into one HTML file.
7. Keep `framer-motion`, `lucide-react`, and `jspdf`.
8. Do not remove the PDF export function.
9. Do not remove the coverage intro animation.
10. Do not remove the design methodology notes at the bottom.
11. Do not remove the listener, DBAP, room modes, coverage, JSON import, or coordinate table sections.

## Known current issue to check

The current React file has had many JSX edits. Carefully run:

```bash
npm run build
```

Fix all JSX syntax errors.

Common problems:

* missing `}`
* extra `}`
* JSX conditionals not closed
* large one-line JSX sections
* missing closing `</div>` or `</Card>`
* duplicate helper functions
* invalid JSX inside SVG

Prefer rewriting dense JSX into clean multi-line JSX instead of patching tiny pieces.

## Standalone HTML build config

Use `vite-plugin-singlefile`.

`vite.config.js` should include:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src")
    }
  },
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
```

## UI requirement

The app should retain:

* white canvas background
* 16:9 main 3D layout
* left layer controls
* right selected speaker and listener coordinates
* DBAP tab
* room modes tab
* coverage tab
* colorful coverage frustums
* PDF export button
* JSON import
* coordinates table
* bottom design methodology notes
* footer with AudioToys and revision email

## Coverage defaults

Default speaker specs:

* H90
* V60
* Throw 10 m
* SPL 109 dB @ 1 m

Default coverage scope:

* Visible / focused speakers

On fresh page load, run coverage transition:

1. Middle coverage
2. Upper coverage
3. Ceiling coverage
4. All speaker coverage
5. Coverage off

Then return to normal default state.

## Build verification

After fixes, confirm:

* `npm run build` passes
* `dist/index.html` opens in Chrome/Safari
* the 3D layout renders
* coverage tab works
* PDF export produces a file
* JSON import does not crash
* no console errors on first page load
