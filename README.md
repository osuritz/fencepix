# fencepix

Plan chain-link fence pixel art: upload a photo, quantize it onto the fence's
diamond lattice using purchasable insert colors (e.g. Put-in-Cups), touch it
up by hand, then export a shopping list, a printable installation chart, and
a PNG preview. Everything runs in the browser — no backend, images never
leave your machine.

## Stack

React 19 + Vite, styled with Tailwind 4 (`@tailwindcss/vite`) and
[shadcn/ui](https://ui.shadcn.com) components built on Base UI primitives.
Light/dark mode is a CSS-variable theme toggled by a `ThemeProvider`
(`src/ui/theme.tsx`) that follows the OS by default and persists the choice
in `localStorage`; the fence canvas repaints its ground/wire colors from
theme variables when the mode flips. The printable installation chart and
PNG export are always rendered light — paper and exported images don't
follow dark mode.

## Develop

    npm install
    npm run dev     # local dev server
    npm test        # vitest suite
    npm run build   # production build (static, deploy anywhere)

## Docs

- Design spec: `docs/superpowers/specs/2026-07-13-fencepix-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-13-fencepix.md`
- Stack restyle spec: `docs/superpowers/specs/2026-07-14-stack-restyle-design.md`
- Stack restyle plan: `docs/superpowers/plans/2026-07-14-stack-restyle.md`
