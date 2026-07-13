import type { GridDims } from './lattice'

export const EMPTY = 0            // base/composite grids: no insert
export const UNTOUCHED = 0        // overlays: defer to base
export const OVERLAY_EMPTY = 0xffff // overlays: explicit eraser

export function createCells(d: GridDims): Uint16Array {
  return new Uint16Array(d.cols * d.rows)
}

export function cellIndex(row: number, col: number, d: GridDims): number {
  return row * d.cols + col
}

export function composite(base: Uint16Array, overlay: Uint16Array): Uint16Array {
  const out = base.slice()
  for (let i = 0; i < out.length; i++) {
    const o = overlay[i]
    if (o !== UNTOUCHED) out[i] = o === OVERLAY_EMPTY ? EMPTY : o
  }
  return out
}
