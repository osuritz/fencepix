# Canvas Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Remap canvas navigation to graphics-editor conventions — wheel pans, Ctrl/Cmd+wheel (and pinch) zooms at cursor, Cmd/Ctrl +/−/0/1 keyboard zoom.

**Architecture:** Pure view-math helpers (`panBy`, `zoomAt`, `fitView`) join `Viewport` in `src/ui/render.ts` with unit tests; `FenceCanvas` handlers become thin wiring. Deliberate behavior change from v1: plain wheel no longer zooms.

**Tech Stack:** existing (React 19, Vitest 4). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-14-canvas-navigation-design.md` — read it first.

## Global Constraints

- The existing 110-test suite passes UNMODIFIED (no current test asserts wheel/keyboard canvas behavior); new helper tests are added on top. `npm test` + `npm run build` green before every commit.
- Zoom clamp: pxPerUnit ∈ [2, 100]. Default viewport: `{ offsetX: 24, offsetY: 24, pxPerUnit: 12 }`. Fit padding: 5% (×0.95). Keyboard zoom step: ×1.25.
- Keyboard shortcuts skip when focus is in input/textarea/contentEditable (same guard as Cmd+Z in App.tsx) and call `preventDefault()`.
- Every commit message ends with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: View-math helpers (`src/ui/render.ts`)

**Files:**
- Modify: `src/ui/render.ts`
- Test: `src/ui/render.test.ts` (append)

**Interfaces:**
- Consumes: existing `Viewport`, `screenToDesign`; `designSize`, `GridDims` from `../core/lattice`.
- Produces (Task 2 relies on these exactly):
```ts
export const MIN_PPU = 2
export const MAX_PPU = 100
export const DEFAULT_VIEW: Viewport  // { offsetX: 24, offsetY: 24, pxPerUnit: 12 }
export function panBy(v: Viewport, dx: number, dy: number): Viewport   // offsets -= deltas
export function zoomAt(v: Viewport, anchorX: number, anchorY: number, factor: number): Viewport
export function fitView(d: GridDims, width: number, height: number): Viewport
```

- [ ] **Step 1: Write the failing tests** — append to `src/ui/render.test.ts`:

```ts
import { DEFAULT_VIEW, fitView, panBy, zoomAt } from './render'

describe('panBy', () => {
  test('moves offsets opposite the scroll deltas', () => {
    expect(panBy(v, 10, -5)).toEqual({ offsetX: 40, offsetY: 25, pxPerUnit: 10 })
  })
})

describe('zoomAt', () => {
  test('keeps the design point under the anchor fixed', () => {
    const v2 = zoomAt(v, 200, 150, 2)
    expect(v2.pxPerUnit).toBe(20)
    const before = screenToDesign(v, 200, 150)
    const after = screenToDesign(v2, 200, 150)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
  test('clamps at both ends', () => {
    expect(zoomAt(v, 0, 0, 1000).pxPerUnit).toBe(100)
    expect(zoomAt(v, 0, 0, 0.0001).pxPerUnit).toBe(2)
  })
})

describe('fitView', () => {
  test('fits the limiting axis with 5% padding and centers', () => {
    // designSize({cols:41, rows:32}) = { width: 83, height: 33 }
    const view = fitView({ cols: 41, rows: 32 }, 830, 660)
    expect(view.pxPerUnit).toBeCloseTo(9.5) // min(830/83, 660/33) * 0.95 = 10 * 0.95
    expect(view.offsetX).toBeCloseTo((830 - 83 * 9.5) / 2)
    expect(view.offsetY).toBeCloseTo((660 - 33 * 9.5) / 2)
  })
  test('degenerate dims fall back to the default view', () => {
    expect(fitView({ cols: 0, rows: 0 }, 800, 600)).toEqual(DEFAULT_VIEW)
  })
})
```

(The existing `v` fixture at the top of the file is `{ offsetX: 50, offsetY: 20, pxPerUnit: 10 }` — reuse it; keep the existing `import { designToScreen, screenToDesign, visibleRange } from './render'` line and merge imports as needed. Note the test file currently has no `describe` import — add it to the vitest import if absent.)

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run src/ui/render.test.ts` (missing exports).

- [ ] **Step 3: Implement** — add to `src/ui/render.ts` (import `designSize` from `../core/lattice`):

```ts
export const MIN_PPU = 2
export const MAX_PPU = 100
export const DEFAULT_VIEW: Viewport = { offsetX: 24, offsetY: 24, pxPerUnit: 12 }

const clampPpu = (ppu: number) => Math.min(MAX_PPU, Math.max(MIN_PPU, ppu))

// Pan by scroll deltas: content follows the gesture, so offsets move opposite.
export function panBy(v: Viewport, dx: number, dy: number): Viewport {
  return { ...v, offsetX: v.offsetX - dx, offsetY: v.offsetY - dy }
}

// Zoom by factor keeping the design point under (anchorX, anchorY) fixed.
export function zoomAt(v: Viewport, anchorX: number, anchorY: number, factor: number): Viewport {
  const pxPerUnit = clampPpu(v.pxPerUnit * factor)
  const before = screenToDesign(v, anchorX, anchorY)
  return {
    pxPerUnit,
    offsetX: anchorX - before.x * pxPerUnit,
    offsetY: anchorY - before.y * pxPerUnit,
  }
}

// Fit the whole design in the canvas with 5% padding, centered.
export function fitView(d: GridDims, width: number, height: number): Viewport {
  const ds = designSize(d)
  if (ds.width <= 0 || ds.height <= 0 || width <= 0 || height <= 0) return DEFAULT_VIEW
  const pxPerUnit = clampPpu(Math.min(width / ds.width, height / ds.height) * 0.95)
  return {
    pxPerUnit,
    offsetX: (width - ds.width * pxPerUnit) / 2,
    offsetY: (height - ds.height * pxPerUnit) / 2,
  }
}
```

- [ ] **Step 4: Run to verify PASS** — `npx vitest run src/ui/render.test.ts`, then `npm test` (115 total expected) and `npm run build`.

- [ ] **Step 5: Commit** — `feat: view-math helpers for pan, anchored zoom, fit`

---

### Task 2: FenceCanvas wiring + toolbar hint

**Files:**
- Modify: `src/ui/components/FenceCanvas.tsx`, `src/ui/components/Toolbar.tsx`

**Interfaces:**
- Consumes: `panBy`, `zoomAt`, `fitView`, `DEFAULT_VIEW` from `../render` (Task 1); existing `useStore`, `draw`, `viewRef`.
- Produces: no new exports — behavior only.

- [ ] **Step 1: Replace the wheel handler** in the native-listener `useEffect` of `FenceCanvas.tsx`:

```tsx
const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  if (e.ctrlKey || e.metaKey) {
    // Zoom at cursor. Trackpad pinch arrives as ctrl+wheel with small deltas;
    // 0.0035 balances mouse-notch (~30%/notch) and pinch smoothness.
    const rect = canvas.getBoundingClientRect()
    viewRef.current = zoomAt(
      viewRef.current,
      e.clientX - rect.left,
      e.clientY - rect.top,
      Math.exp(-e.deltaY * 0.0035),
    )
  } else if (e.shiftKey && e.deltaX === 0) {
    viewRef.current = panBy(viewRef.current, e.deltaY, 0) // mouse: shift+wheel pans horizontally
  } else {
    viewRef.current = panBy(viewRef.current, e.deltaX, e.deltaY)
  }
  draw()
}
```

- [ ] **Step 2: Replace the initial viewport literal** `{ offsetX: 24, offsetY: 24, pxPerUnit: 12 }` with `DEFAULT_VIEW` (spread it: `useRef<Viewport>({ ...DEFAULT_VIEW })` so the constant is never mutated by drag-pan code that writes `viewRef.current = {...}` — check the drag code: it replaces the object, but spread anyway for safety).

- [ ] **Step 3: Add keyboard zoom** — in the same `useEffect` that registers the Space handler, add a second keydown listener (registered and cleaned up alongside it):

```tsx
const onZoomKey = (e: KeyboardEvent) => {
  if (!(e.metaKey || e.ctrlKey)) return
  const t = e.target as HTMLElement
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable) return
  const c = canvasRef.current
  if (!c) return
  const cx = c.clientWidth / 2
  const cy = c.clientHeight / 2
  if (e.key === '=' || e.key === '+') {
    viewRef.current = zoomAt(viewRef.current, cx, cy, 1.25)
  } else if (e.key === '-') {
    viewRef.current = zoomAt(viewRef.current, cx, cy, 1 / 1.25)
  } else if (e.key === '0') {
    viewRef.current = fitView(useStore.getState().project.dims, c.clientWidth, c.clientHeight)
  } else if (e.key === '1') {
    viewRef.current = zoomAt(viewRef.current, cx, cy, DEFAULT_VIEW.pxPerUnit / viewRef.current.pxPerUnit)
  } else {
    return
  }
  e.preventDefault()
  draw()
}
window.addEventListener('keydown', onZoomKey)
// ...and in the cleanup: window.removeEventListener('keydown', onZoomKey)
```

  (Note: `preventDefault` after the key match so unmatched Cmd+keys — like Cmd+Z — pass through untouched. Cmd+Z handling lives in App.tsx and must keep working.)

- [ ] **Step 4: Update the toolbar hint** in `Toolbar.tsx`: replace the hint text with
  `scroll = pan · ⌘/ctrl+scroll = zoom · ⌘0 = fit · space-drag = pan`

- [ ] **Step 5: Verify** — `npm test` (115, unmodified originals) and `npm run build` clean. No jsdom test can drive wheel/keys on a real canvas; browser verification is the controller's job after review.

- [ ] **Step 6: Commit** — `feat: photoshop-style canvas navigation (wheel pan, ctrl+wheel zoom, keyboard zoom)`

## Self-review notes

- Spec coverage: gestures (T2 step 1), space/middle drag untouched (no edits there), keyboard incl. guard + preventDefault placement (T2 step 3), helpers + clamps + degenerate fit (T1), hint (T2 step 4), tests (T1). Complete.
- `e.key === '='` covers Cmd+= (US layouts); `'+'` covers explicit plus. Cmd+0 page-zoom reset is preventable in Chromium/Firefox when focus is in-page.
- App.test mounts FenceCanvas under jsdom: new listeners register on window — harmless; jsdom fires none of them; cleanup verified by existing unmount paths.
