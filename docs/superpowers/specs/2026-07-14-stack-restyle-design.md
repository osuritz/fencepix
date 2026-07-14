# Fencepix — Stack Migration & Workbench Dark Mode

**Date:** 2026-07-14
**Status:** Approved (user-directed)
**Extends:** 2026-07-13-fencepix-design.md (v1 spec — all behavior therein unchanged)

## What this is

A restyle-and-replatform of the merged v1 app. Design direction **A ("Workbench")**
from the design review is kept — utilitarian, hairline borders, quiet neutrals,
the fence is the interface — now expressed through a component system, and with
full **dark mode** support.

## Stack (user-specified, versions verified 2026-07-14)

- React **19.2.7** (already in place), TypeScript 6, zustand 5 (unchanged)
- Vite **8.1.4** (bump from 8.1.1), Vitest **4.1.10** (already latest)
- Tailwind CSS **4.3.2** via `@tailwindcss/vite` — CSS-first config
  (`@import "tailwindcss"`), no tailwind.config file
- **shadcn/ui (CLI 4.13) with Base UI primitives** — Base UI is shadcn's default
  as of July 2026 (`npx shadcn init`, base library `base`); components imported
  under `@/components/ui/*`
- Path alias `@/*` → `./src/*` (tsconfig.json, tsconfig.app.json, vite.config);
  `@types/node` added for vite.config path resolution

## Dark mode

- shadcn CSS-variable theming: tokens on `:root` (light) and `.dark`; Tailwind
  dark variant driven by the `.dark` class.
- `ThemeProvider` (shadcn Vite pattern): `'light' | 'dark' | 'system'`, default
  **system**, persisted in localStorage key `fencepix-theme`, applies the class
  to `<html>`.
- Mode toggle lives in the toolbar (sun/moon dropdown: Light / Dark / System).
- **Canvas is theme-aware:** the fence ground and wire colors come from CSS
  variables (`--canvas-ground`, `--canvas-wire`) read at draw time; theme
  changes trigger a redraw. Dark theme uses a dark asphalt ground with
  galvanized wire so insert colors read against shadow.
- **Physical outputs stay light:** PNG export and the print chart always render
  on the light ground regardless of UI theme — they represent paper and
  daylight, not the UI.

## Constraints

- **No behavior changes.** All v1 logic, store semantics, error handling, and
  keyboard shortcuts are untouched. `window.confirm` gates stay native.
- **The 110-test suite is the acceptance gate.** Tests may only change where a
  query targets incidental markup; role/label/text semantics must keep passing
  as-is (labels, roles, aria-pressed states, list/table semantics are preserved).
- Print CSS for the chart (`.chart-page`, `.no-print`, page breaks) survives the
  Tailwind migration as a plain CSS layer.
- Workbench look: same three-pane layout, same information density; shadcn
  "new-york"-style controls with neutral base color, small radii, hairline
  borders. No decorative flourishes.

## Out of scope

- Directions B/C from the design review; any layout or feature changes;
  the v1 deferred-findings follow-up list (tracked separately in the ledger).
