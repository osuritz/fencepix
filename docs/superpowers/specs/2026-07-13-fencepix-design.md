# Fencepix — Design Spec

**Date:** 2026-07-13
**Status:** Approved

## What it is

A free, public web app for planning chain-link fence pixel art. Users upload a
photo; the app pixelates it onto the fence's diamond lattice using only colors
of purchasable diamond-shaped fence inserts (e.g., Put-in-Cups), lets them
touch up the result by hand, and produces everything needed to buy and install
the design: a live preview, a per-color shopping list, a printable
installation chart, and an image export.

## Constraints and decisions

- **Audience:** public hobby tool. Handles arbitrary fence sizes, polished
  enough to share.
- **Stack:** React + TypeScript + Vite static SPA. No backend — all image
  processing runs client-side via the Canvas API; images never leave the
  browser. Deployable to any static host (GitHub Pages/Netlify/Vercel).
- **Rendering:** Canvas 2D for the preview/editor (chosen over SVG/DOM, which
  lags at tens of thousands of nodes, and WebGL, which is overkill). The
  printable chart is separate paginated HTML styled with print CSS.
- **State:** zustand store (single small dependency) — chosen for cheap
  transient subscriptions during canvas painting.
- **Persistence:** autosave to localStorage; explicit project export/import as
  JSON files. No accounts.

## Core model

### The lattice

A chain-link fence is not a rectangular pixel grid. Diamonds tile in offset
rows, like brickwork:

- Each diamond has width `W` and height `H` (its horizontal and vertical
  diagonals). For square mesh of size `m` (wire-to-wire distance),
  `W = H = m·√2`.
- Rows are spaced `H/2` apart vertically; odd rows are shifted `W/2`
  horizontally.
- Cells are addressed `(row, col)`; row parity determines the x-offset. Each
  interior diamond has four edge neighbors: up-left, up-right, down-left,
  down-right.

Each cell holds a palette color index or **empty** (no insert — fence shows
through; this is the background mechanism).

### Grid sizing

Users size the design either way, with two-way sync:

- **Physical:** fence width × height (ft/m) plus mesh size (presets 2", 2¼",
  2⅜", or custom) → app computes columns × rows.
- **Direct:** enter columns × rows of diamonds.

Hard cap: 50,000 diamonds (≈ a 170ft × 8ft fence at 2" mesh), with a clear
error message.

### Palette

- `Palette = Array<{ id, name, hex }>`.
- Ships with a preset ("Classic 12", a Put-in-Cups-style color set defined as
  data, easy to add more presets later).
- Users can add/remove/edit colors (hex picker) to match whatever brand they
  buy.

### Pipeline (pure functions in `src/core/`)

1. **Decode** the uploaded image (drag & drop, file picker, or clipboard
   paste). Downscale to a working resolution (longest side ~2048px) first.
2. **Position:** user scales/pans the image under the grid; a "fit" button
   auto-fits.
3. **Sample:** for each diamond, average the source pixels whose centers fall
   inside the diamond's footprint (point-in-diamond test at working
   resolution). Alpha is averaged alongside RGB to drive the transparency
   threshold.
4. **Quantize:** snap each sample to the nearest palette color in OKLab
   (perceptual) space. Options: dithering (error diffusion adapted to the
   lattice's diagonal neighbors) on/off; a transparency threshold below which
   cells become empty.
5. **Edit:** manual paint edits mutate the result grid directly, with
   undo/redo via grid snapshots (grids are ≤50k cells; snapshots are cheap).
   Undo history is a bounded stack of 100 steps; one drag stroke = one step.

Settings changes that don't alter grid dimensions preserve manual edits;
resizing the grid re-runs quantization and clears edits, behind a confirm
dialog.

## Architecture

Two layers:

- `src/core/` — pure TypeScript, zero React imports: lattice geometry
  (coordinates, neighbors, hit-testing), unit conversion, sampling,
  quantization/dithering, shopping-list math, chart pagination. Fully
  unit-testable.
- `src/ui/` — React components, zustand store, canvas rendering. Consumes
  core.

## UI

Single-screen editor: left sidebar of controls, center canvas, right output
panel. Everything is live — changing palette or settings re-quantizes
immediately.

**Left sidebar:**
- *Fence setup* — physical dims + mesh preset ⇄ columns/rows (two-way sync).
- *Image* — dropzone, then scale/pan controls and "fit".
- *Palette* — preset picker, editable color chips.
- *Pixelation* — dithering toggle, transparency-to-empty threshold.

**Center canvas:**
- Fence-realistic preview: gray wire lattice with colored diamonds.
- Zoom (scroll wheel), pan (space-drag).
- Tools: paint brush (click/drag with selected color), eraser (set empty),
  eyedropper, undo/redo (Cmd+Z / Shift+Cmd+Z).

**Right panel (tabs):**
- *Shopping list* — count per color with adjustable overage % (default 5%,
  rounded up per color), total, copy-as-text.
- *Export* — PNG of preview; project JSON download/import.
- *Print chart* — paginated installation chart: row/column-numbered grid
  split across printable pages with a color legend, print CSS so browser
  print-to-PDF works directly.

**First run:** empty state with a "try a sample image" button demonstrating
the full flow in one click.

## Error handling

- **Undecodable images** (e.g., HEIC): friendly inline dropzone message naming
  the format problem.
- **Huge images:** downscaled before sampling; a 50MP photo can't lock the
  tab.
- **Absurd grids:** 50k-diamond cap with clear message.
- **localStorage failure** (quota/private mode): autosave degrades gracefully
  with a "couldn't autosave — use Export" notice; app keeps working.
- **Destructive actions** (grid resize clearing edits, new image over an
  edited design): confirm dialogs.

## Testing

- **Vitest** unit tests for all of `src/core/`: lattice math, physical⇄diamond
  conversion, sampling, OKLab nearest-color + dithering, shopping-list counts
  (incl. overage rounding), chart pagination.
- **React Testing Library** for key interactions: setup form two-way sync,
  palette editing, tab switching.
- **Manual verification checklist** for canvas rendering and print output.

## Out of scope (v1)

- Accounts, server-side anything, shareable URLs.
- Vendor integrations / affiliate links / cart checkout.
- Image adjustments (brightness/contrast/saturation).
- Non-square mesh, slat-style (rectangular) inserts.
- Mobile-optimized editing (must render, but editing is desktop-first).
