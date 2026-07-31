# Configurator Template

Reusable base package for device configurators with a shared layout and application chrome.

The package is intentionally UI/device agnostic. 

`tsconfig.base.json` contains the shared TypeScript compiler defaults for consuming projects.

The shared Vite and ESLint configuration implementations are also maintained here. Consumer projects keep only small path-specific adapters, while framework/tool versions are declared by this package.

## Prerendered single-file builds

Consumer applications that need both initial React markup and a single self-contained HTML file use a two-stage build:

1. A build-only prerender pass uses `react-dom/server` to render the application markup.
2. A client-only Vite build bundles the browser code and uses `hydrateRoot` to hydrate that markup.
3. A small post-build script inserts the prerendered `#root` contents into the client HTML.

This keeps the server renderer out of the browser bundle while preserving the initial rendered page.

The usual consumer-project files are:

- `src/main.tsx` — browser entry; calls `hydrateRoot`.
- `src/prerender.tsx` — build-only entry; exports `prerender` using `renderToString`.
- `vite.config.ts` — client-only single-file build.
- `vite.prerender.config.ts` — temporary prerender build.
- `scripts/inject-prerender.mjs` — copies the rendered root markup into `dist/index.html`.

The build command should run the prerender build first, then the client build, then the injection script. Temporary prerender output should be placed in an ignored directory such as `.prerender-dist`.
