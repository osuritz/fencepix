import { designSize, type GridDims } from '../core/lattice'
import { composite } from '../core/grid'
import type { Project } from '../core/project'
import { drawDesign, LIGHT_GROUND, LIGHT_WIRE } from './render'

export const EXPORT_PX_PER_UNIT = 12 // 24 px per diamond (a diamond is 2 units)
export const MAX_EXPORT_SIDE = 8192

export function exportScale(d: GridDims): number {
  const ds = designSize(d)
  const longSide = Math.max(ds.width, ds.height) * EXPORT_PX_PER_UNIT
  return longSide > MAX_EXPORT_SIDE
    ? EXPORT_PX_PER_UNIT * (MAX_EXPORT_SIDE / longSide)
    : EXPORT_PX_PER_UNIT
}

export function renderPngBlob(p: Project): Promise<Blob> {
  const ds = designSize(p.dims)
  const ppu = exportScale(p.dims)
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(ds.width * ppu)
  canvas.height = Math.ceil(ds.height * ppu)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = LIGHT_GROUND
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawDesign(ctx, p.dims, composite(p.base, p.overlay), p.palette,
    { offsetX: 0, offsetY: 0, pxPerUnit: ppu },
    { width: canvas.width, height: canvas.height }, LIGHT_WIRE)
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png')
  })
}
