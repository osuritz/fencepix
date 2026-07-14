# Fencepix — Photoshop/Excalidraw-Style Canvas Navigation

**Date:** 2026-07-14
**Status:** Approved
**Extends:** 2026-07-13-fencepix-design.md; supersedes its wheel-zoom gesture.

## What this is

Remap canvas navigation to match graphics-editor conventions (Photoshop,
Excalidraw, Figma), plus standard keyboard zoom shortcuts. This deliberately
**changes** the v1 wheel behavior: plain wheel panned nothing and zoomed;
now it pans, and modified wheel zooms.

## Gestures (canvas wheel listener — stays native + non-passive)

- **Plain wheel / two-finger trackpad scroll → pan both axes:**
  `offsetX -= deltaX; offsetY -= deltaY`. With Shift held and no `deltaX`,
  vertical wheel pans horizontally (mouse-user convention).
- **Ctrl or Cmd + wheel → zoom anchored at the cursor** (existing math;
  browser trackpad **pinch** emits ctrl+wheel, so pinch-zoom works
  automatically). Zoom clamp unchanged: 2–100 px per design unit.
- **Space + left-drag** and **middle-button drag** pan — unchanged from v1.
- `preventDefault()` on all handled wheel events (already non-passive).

## Keyboard (window keydown in FenceCanvas, guarded like Cmd+Z)

Skipped entirely when focus is in an input/textarea/contentEditable.
All four call `preventDefault()` (they'd otherwise trigger browser page zoom).

- **Cmd/Ctrl + `=` (or `+`)** — zoom in ×1.25, anchored at canvas center.
- **Cmd/Ctrl + `-`** — zoom out ÷1.25, anchored at canvas center.
- **Cmd/Ctrl + `0`** — fit: pxPerUnit = min(canvasW/designW, canvasH/designH)
  × 0.95, design centered in the canvas (clamped to the zoom range).
- **Cmd/Ctrl + `1`** — 100%: pxPerUnit = 12 (the app default), anchored at
  canvas center.

## Structure

Pure helpers in `src/ui/render.ts` (which owns `Viewport`):

```ts
export function panBy(v: Viewport, dx: number, dy: number): Viewport
export function zoomAt(v: Viewport, anchorX: number, anchorY: number, factor: number): Viewport
  // clamps pxPerUnit to [2, 100]; the design point under (anchorX, anchorY) stays fixed
export function fitView(d: GridDims, width: number, height: number): Viewport
  // 5% padding, centered; clamps to [2, 100]; degenerate dims (0 cells) →
  // the component's initial viewport { offsetX: 24, offsetY: 24, pxPerUnit: 12 }
```

FenceCanvas's wheel/keyboard handlers become thin wiring over these. The
existing inline wheel-zoom math is replaced by `zoomAt`.

## UI copy

Toolbar hint becomes: `scroll = pan · ⌘/ctrl+scroll = zoom · ⌘0 = fit ·
space-drag = pan` (⌘ rendered as-is; it reads fine on non-mac too since
ctrl is named).

## Testing

- Vitest unit tests for `panBy`, `zoomAt` (anchor invariance: the design
  coordinate under the anchor is identical before/after; clamping at both
  ends), and `fitView` (fits both axes with padding, centers, degenerate
  dims fall back to the default viewport).
- The existing 110-test suite must keep passing; no existing test asserts
  wheel/keyboard canvas behavior.
- Gesture wiring (wheel pan/zoom, pinch, shortcuts) verified in the browser
  per `.claude/skills/verify/SKILL.md`, both themes not required (navigation
  is theme-independent) — one theme suffices.

## Out of scope

- Hand tool (H) and zoom % indicator/buttons (deferred — "full kit" option
  not chosen).
- Touch-screen gestures (pointer-based pinch on touch devices).
- Plain-drag panning when no color is selected.
