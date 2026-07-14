---
name: verify
description: Build, launch, and drive fencepix end-to-end for verification
---

# Verifying fencepix

## Launch

- `npm run dev` → http://localhost:5173 (port binding needs the command sandbox disabled)
- `npm test` (vitest/jsdom) and `npm run build` (tsc -b + vite) are CI gates, not verification

## Driving the app (chrome-devtools MCP)

- The fence canvas has **no a11y node** — tag it first via
  `evaluate_script: c => c.setAttribute('role','img') + aria-label`, re-snapshot, then
  `click(uid)` for **trusted** pointer events. Synthetic PointerEvents fail: the
  pointerdown handler calls `setPointerCapture`, which throws for untrusted pointerIds.
- React-controlled inputs (range slider, selects): set value via the native prototype
  setter, then `dispatchEvent(new Event('input'|'change', {bubbles:true}))`.
- `window.confirm` gates: "Reset to Classic 12" and grid resize. Use evaluate_script's
  `dialogAction: 'accept'` or `handle_dialog`. A stray second confirm was observed once
  after reset — check for open dialogs and dismiss.
- Paint requires selecting a palette color first (paint no-ops with none selected).

## Flows worth driving

1. "Try a sample image" → heart quantizes; shopping list math: Buy = ceil(Used × 1.05).
2. Paint a cell → Undo enables; Cmd+Z focused in a text input must NOT undo (guard).
3. Threshold slider to 0 → grid must NOT flood with the first palette color (NaN guard).
4. Remove an in-use color → inline remap dialog. Note: base (image-derived) cells
   re-quantize to nearest remaining colors; only hand-painted overlay cells take the
   chosen remap color. Undo must be disabled after palette ops.
5. Print chart → page count = ceil(cols/25) × ceil(rows/30); legend numbers = palette order.
6. Wait >800ms (autosave debounce), reload → design restores from IndexedDB;
   sample-image button stays hidden.

## Gotchas

- Browser requests /favicon.ico → 404 in console (no favicon shipped); benign.
- DevTools flags "form field should have id or name" issues (aria-label-only inputs).
