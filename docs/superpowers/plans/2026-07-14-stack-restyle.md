# Stack Migration & Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replatform the merged v1 app onto Tailwind 4 + shadcn/ui (Base UI) with a dark mode, preserving the Workbench design and all v1 behavior.

**Architecture:** Styling moves from bespoke CSS to Tailwind utilities + shadcn components themed by CSS variables (`:root` / `.dark`). A ThemeProvider applies the theme class; the canvas reads ground/wire colors from CSS variables at draw time. Core (`src/core/`) is untouched.

**Tech Stack:** React 19.2.7, Vite 8.1.4, Vitest 4.1.10, Tailwind 4.3.2 (`@tailwindcss/vite`), shadcn CLI 4.13 with Base UI primitives, zustand 5.

**Spec:** `docs/superpowers/specs/2026-07-14-stack-restyle-design.md` — read it first.

## Global Constraints

- **The existing 110-test suite is the acceptance gate for every task.** `npm test` and `npm run build` green before every commit. A test may be edited ONLY when it queries incidental markup (a CSS class, a tag name); all role/label/text/aria queries must pass unmodified. Any test edit must be called out in the task report with justification.
- **No behavior changes**: store, core, persistence, keyboard shortcuts, `window.confirm` gates all stay as-is.
- New dependency allowlist additions (exact): `tailwindcss`, `@tailwindcss/vite`, `@types/node`, plus whatever `npx shadcn init`/`add` itself installs (Base UI primitives `@base-ui-components/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css` as applicable). Nothing else.
- Theme storage key: `fencepix-theme`. Canvas CSS variables: `--canvas-ground`, `--canvas-wire`. Export/print always use light-ground constants (`#e8eaec` ground, `#9aa1a6` wire).
- Print CSS block (`.print-chart`, `.chart-page`, `.no-print`, `@media print`) must survive verbatim in `src/index.css`.
- Workbench look: neutral base color, small radii (`--radius` ≤ 0.375rem), hairline borders, information density unchanged.
- Every commit message ends with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Toolchain — Vite bump, Tailwind 4, path aliases

**Files:** Modify `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `src/index.css`.

- [ ] `npm install -D vite@8.1.4 tailwindcss@4.3.2 @tailwindcss/vite@4.3.2 @types/node`
- [ ] `vite.config.ts` — add the Tailwind plugin and alias (keep the existing `test` block exactly):

```ts
/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] Add to `compilerOptions` in BOTH `tsconfig.json` and `tsconfig.app.json`:
  `"baseUrl": ".", "paths": { "@/*": ["./src/*"] }`
  (`tsconfig.json` is a project-references solution file — if it has no `compilerOptions`, add the block; shadcn's CLI reads it.)
- [ ] Prepend `@import "tailwindcss";` as the FIRST line of `src/index.css`, keeping ALL existing rules below it for now (they are removed panel-by-panel in Tasks 4–6). Delete the old `* { box-sizing... }` reset only if Tailwind preflight makes it redundant (it does — remove the reset line, keep everything else).
- [ ] Verify: `npm test` → 110 passing; `npm run build` → clean. The app must render unchanged (`npm run dev`, eyeball or curl the root).
- [ ] Commit: `chore: vite 8.1.4, tailwind 4 via vite plugin, @ path alias`

### Task 2: shadcn init (Base UI) + components

**Files:** Create `components.json`, `src/lib/utils.ts`, `src/components/ui/*`; modify `src/index.css` (init injects theme variables), `package.json`.

- [ ] `npx shadcn@latest init` — non-interactive flags preferred: base library **base** (Base UI — the default; pass `-b base` to be explicit), base color **neutral**, CSS variables **yes**, css file `src/index.css`, components alias `@/components`, utils `@/lib/utils`. If the CLI asks about React Server Components, answer no (Vite SPA).
- [ ] `npx shadcn@latest add button input select checkbox slider tabs dropdown-menu label`
- [ ] Inspect the injected `:root`/`.dark` variable blocks in `src/index.css`; add the two canvas tokens to each:
  - `:root` → `--canvas-ground: #e8eaec; --canvas-wire: #9aa1a6;`
  - `.dark` → `--canvas-ground: #141518; --canvas-wire: #4b5157;`
  Set `--radius: 0.375rem` (Workbench: small radii).
- [ ] Verify `npm test` (110) + `npm run build`; commit: `chore: shadcn init with base-ui primitives and core components`

### Task 3: ThemeProvider, mode toggle, theme-aware canvas

**Files:** Create `src/ui/theme.tsx`; modify `src/main.tsx`, `src/ui/components/Toolbar.tsx`, `src/ui/render.ts`, `src/ui/components/FenceCanvas.tsx`, `src/ui/exportPng.ts`.

- [ ] `src/ui/theme.tsx` — shadcn Vite pattern, exact code:

```tsx
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'system'
const STORAGE_KEY = 'fencepix-theme'

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'system',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system',
  )

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t)
    setThemeState(t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

  (jsdom note: `localStorage` and `matchMedia` — jsdom has localStorage; `matchMedia` is missing. Add to `src/test/setup.ts`:

```ts
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as MediaQueryList
}
```
  )
- [ ] Wrap `<App />` with `<ThemeProvider>` in `src/main.tsx`.
- [ ] Mode toggle in `Toolbar.tsx`: shadcn `DropdownMenu` + `Button` variant `ghost` with lucide `Sun`/`Moon` icons, items Light / Dark / System calling `setTheme`. Place after the hint text.
- [ ] Theme-aware canvas: in `src/ui/render.ts` export

```ts
export const LIGHT_GROUND = '#e8eaec'
export const LIGHT_WIRE = '#9aa1a6'
export function canvasColors(el: HTMLElement): { ground: string; wire: string } {
  const s = getComputedStyle(el)
  return {
    ground: s.getPropertyValue('--canvas-ground').trim() || LIGHT_GROUND,
    wire: s.getPropertyValue('--canvas-wire').trim() || LIGHT_WIRE,
  }
}
```

  `drawDesign` gains a `wire` color parameter (default `LIGHT_WIRE`) replacing the hardcoded `#9aa1a6`. `FenceCanvas.draw()` uses `canvasColors(canvas)` for ground fill and wire, and a `MutationObserver` on `document.documentElement` (attribute `class`) triggers `draw()` so theme flips repaint. `exportPng.ts` passes `LIGHT_GROUND`/`LIGHT_WIRE` explicitly (exports stay light).
- [ ] Verify 110 tests + build; manual: toggle dark, canvas ground flips, PNG export still light. Commit: `feat: theme provider, mode toggle, theme-aware canvas`

### Task 4: Migrate sidebar panels to shadcn + Tailwind

**Files:** Modify `FenceSetupPanel.tsx`, `ImagePanel.tsx`, `PalettePanel.tsx`, `PixelationPanel.tsx`; trim corresponding rules from `src/index.css`.

Component mapping (keep every label string, aria-label, and control semantic identical — the RTL suites must pass unmodified):
- `<input type=number|text>` → shadcn `Input` (`h-8 text-sm`); labels → shadcn `Label` (keep label-wraps-input structure where tests rely on it — they use `getByLabelText`, which works with both wrapping and htmlFor)
- `<select>` → KEEP native `<select>` elements styled with Tailwind classes (`border-input` etc.). Rationale: tests drive them with `userEvent.selectOptions`, which requires native selects; shadcn/Base-UI Select is a popup listbox and would break them. Style-only.
- Buttons → shadcn `Button` (`variant="outline" size="sm"` default; primary action `variant="default"`); palette swatch buttons stay plain `<button>` with Tailwind (aria-pressed ring: `aria-pressed:ring-2`)
- Checkbox (dithering) → KEEP native checkbox styled via Tailwind (`accent-primary`) — test uses `.click()` toggling; native is safe. Slider (threshold) → KEEP native range input styled via Tailwind for the same reason (`userEvent`/change events).
- Panel chrome: `.panel` → `flex flex-col gap-2 border-b p-3`; headings → `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Error text → `text-destructive text-sm`; dropzone → `rounded-md border-2 border-dashed border-muted-foreground/40 p-3 text-center text-sm text-muted-foreground`
- Remap dialog stays inline (NOT a modal) — restyle with `border-destructive/50 rounded-md border p-2` etc.
- [ ] Remove the now-unused sidebar rules from `index.css` (`.panel`, `.palette-list`, `.palette-chip`, `.dropzone`, `.error`, `.image-controls`, `.remap-dialog`) once no component references them.
- [ ] Verify 110 tests + build; visual parity check in dev. Commit: `refactor: sidebar panels on shadcn/tailwind`

### Task 5: Migrate toolbar, output tabs, banner

**Files:** Modify `Toolbar.tsx`, `App.tsx`, `ShoppingListTab.tsx`, `ExportTab.tsx`; trim `index.css`.

- Tool buttons: shadcn `Button` with `aria-pressed` preserved (`variant="outline"`, pressed state via `aria-pressed:bg-secondary`); Undo/Redo keep `disabled` semantics.
- Right-panel tabs: keep them as the existing button-driven conditional render (they're app state, and App.test queries `getByRole('button', { name: /shopping list/i })`) — restyle with shadcn `Button` + `aria-pressed`. Do NOT convert to shadcn `Tabs` (would change roles to `tab`).
- Shopping table: Tailwind table classes (`text-sm`, `tabular-nums` on number cells); swatches keep `.swatch`-equivalent inline style block via Tailwind (`inline-block size-4 rounded border`); keep `<table>/<tbody>` structure (tests query rows).
- Autosave banner: `fixed bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md bg-destructive px-4 py-2 text-destructive-foreground` + keep `no-print` class and `role="alert"`.
- App shell: CSS grid via Tailwind (`grid h-full grid-cols-[280px_1fr_300px]`), sidebar/output `overflow-y-auto border-r`/`border-l`, canvas column `flex min-w-0 flex-col`. Keep `.app-shell` class name on the root div (print CSS hides it).
- [ ] Remove migrated rules from `index.css` (`.app-shell` layout block, `.toolbar`, `.output-panel`, `.canvas-area`, `.fence-canvas` sizing → Tailwind `flex-1 w-full touch-action-none cursor-crosshair` via `touch-none`, `.current-color`, `.autosave-banner`, `.swatch`) — BUT `.app-shell` must remain targetable: keep the class in markup; the `@media print` rule references it.
- [ ] Verify 110 tests + build. Commit: `refactor: toolbar, output panel, shell on shadcn/tailwind`

### Task 6: PrintChart chrome + CSS cleanup

**Files:** Modify `PrintChart.tsx`, `src/index.css`, `README.md`.

- PrintChart screen chrome to Tailwind (`fixed inset-0 z-10 overflow-auto bg-white p-4 text-neutral-900` — the chart is ALWAYS light, even in dark mode: it's paper). Keep class names `print-chart`, `chart-page`, `chart-legend`, `chart-actions`, `no-print` (print CSS + tests depend on structure).
- `index.css` ends as: tailwind import, shadcn theme blocks (with canvas tokens), the print CSS block, and nothing else bespoke except rules still genuinely needed.
- README: stack section updated (Tailwind 4, shadcn + Base UI, dark mode note).
- [ ] Verify 110 tests + build. Commit: `refactor: print chart chrome; css cleanup; readme`

### Task 7: Full verification (both themes)

- [ ] `npm test` (all), `npm run build`, `npx tsc -b --force`.
- [ ] Browser checklist per `.claude/skills/verify/SKILL.md`, in BOTH themes: sample image, paint/undo, shopping list, threshold 0 probe, remap dialog, print chart (light in both), reload/autosave, PNG export ground stays light, mode toggle persists across reload, system mode follows OS.
- [ ] Commit any final polish; report.

## Self-review notes

- Native select/checkbox/range retained deliberately (test-driven) — this is a
  spec decision, not an omission; reviewers should not flag it.
- `tsconfig.json` solution-file alias: shadcn CLI requires it even though only
  tsconfig.app.json affects compilation.
- jsdom matchMedia shim goes in setup.ts (Task 3) — without it ThemeProvider
  crashes App.test.
