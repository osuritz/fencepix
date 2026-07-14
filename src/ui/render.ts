import { cellCenter, designSize, type GridDims } from '../core/lattice'
import { EMPTY } from '../core/grid'
import type { Palette } from '../core/palette'

export interface Viewport { offsetX: number; offsetY: number; pxPerUnit: number }

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

export function designToScreen(v: Viewport, x: number, y: number) {
  return { x: v.offsetX + x * v.pxPerUnit, y: v.offsetY + y * v.pxPerUnit }
}

export function screenToDesign(v: Viewport, x: number, y: number) {
  return { x: (x - v.offsetX) / v.pxPerUnit, y: (y - v.offsetY) / v.pxPerUnit }
}

export function visibleRange(v: Viewport, w: number, h: number, d: GridDims) {
  const tl = screenToDesign(v, 0, 0)
  const br = screenToDesign(v, w, h)
  return {
    rowMin: Math.max(0, Math.floor(tl.y) - 2),
    rowMax: Math.min(d.rows - 1, Math.ceil(br.y)),
    colMin: Math.max(0, Math.floor(tl.x / 2) - 2),
    colMax: Math.min(d.cols - 1, Math.ceil(br.x / 2)),
  }
}

function diamondPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r, cy)
  ctx.lineTo(cx, cy + r)
  ctx.lineTo(cx - r, cy)
  ctx.closePath()
}

export const LIGHT_GROUND = '#e8eaec'
export const LIGHT_WIRE = '#9aa1a6'

export function canvasColors(el: HTMLElement): { ground: string; wire: string } {
  const s = getComputedStyle(el)
  return {
    ground: s.getPropertyValue('--canvas-ground').trim() || LIGHT_GROUND,
    wire: s.getPropertyValue('--canvas-wire').trim() || LIGHT_WIRE,
  }
}

export function drawDesign(
  ctx: CanvasRenderingContext2D, d: GridDims, cells: Uint16Array,
  palette: Palette, v: Viewport, size: { width: number; height: number },
  wire: string = LIGHT_WIRE,
): void {
  const colorById = new Map(palette.colors.map(c => [c.id, c.hex]))
  const { rowMin, rowMax, colMin, colMax } = visibleRange(v, size.width, size.height, d)
  const r = v.pxPerUnit
  for (let row = rowMin; row <= rowMax; row++) {
    for (let col = colMin; col <= colMax; col++) {
      const c = cellCenter(row, col)
      const s = designToScreen(v, c.x, c.y)
      const id = cells[row * d.cols + col]
      diamondPath(ctx, s.x, s.y, r)
      if (id !== EMPTY) {
        ctx.fillStyle = colorById.get(id) ?? '#ff00ff'
        ctx.fill()
      }
      ctx.strokeStyle = wire
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}
