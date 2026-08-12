# VillageGuard

VillageGuard is now moving toward a browser-based version. The current implementation work lives in the `web/` folder as a client-only Next.js app that can be exported statically for GitHub Pages.

hosted link: https://treymcgarity.github.io/VillageGuard/

## Current status

- The original Java console game still exists in `src/`.
- The new browser build is being developed in `web/`.
- The first web slice is already set up to run without a backend and to export static HTML.

## Web app

Install dependencies:

```bash
cd web
npm install
```

Run the development server:

```bash
npm run dev
```

Create a production build for static hosting:

```bash
npm run build
```

The build is configured for static export, which makes it compatible with GitHub Pages.

## Planned browser gameplay

- Keep the game text-based for now, but render it as a polished UI.
- Move commands into buttons and panels instead of terminal input.
- Keep the game client-only, with no Express API.
- Add stronger visual styling before introducing more complex art or effects.

## Project files

- `src/` - original Java sources for the console version
- `web/` - Next.js frontend in progress

## Notes

- `web/` is the active implementation path for the browser version.
- GitHub Pages support will come from the exported static build in `web/out`.