import { gridFromPhysical, type GridDims } from './lattice'
import { createCells } from './grid'
import { CLASSIC_12, createPalette, type Palette } from './palette'
import type { ImageTransform } from './sample'

export interface ProjectSettings { dither: boolean; alphaThreshold: number; overagePct: number }
export interface ProjectImage { dataUrl: string; width: number; height: number }

export interface Project {
  version: 1
  dims: GridDims
  meshInches: number
  palette: Palette
  base: Uint16Array
  overlay: Uint16Array
  settings: ProjectSettings
  image: ProjectImage | null
  transform: ImageTransform
}

export function defaultProject(): Project {
  const dims = gridFromPhysical(120, 48, 2) // 10ft × 4ft at 2in mesh
  return {
    version: 1,
    dims,
    meshInches: 2,
    palette: createPalette(CLASSIC_12),
    base: createCells(dims),
    overlay: createCells(dims),
    settings: { dither: true, alphaThreshold: 0.5, overagePct: 5 },
    image: null,
    transform: { x: 0, y: 0, scale: 1 },
  }
}

// Grids travel as base64 of their little-endian bytes. Every platform we
// target is little-endian; the format is only read back by this code.
function u16ToBase64(a: Uint16Array): string {
  const bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(s)
}

function base64ToU16(s: string): Uint16Array {
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Uint16Array(bytes.buffer)
}

export function serializeProject(p: Project): string {
  return JSON.stringify({
    ...p,
    base: u16ToBase64(p.base),
    overlay: u16ToBase64(p.overlay),
  })
}

function invalid(): never {
  throw new Error('invalid project file')
}

export function deserializeProject(json: string): Project {
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(json)
  } catch {
    invalid()
  }
  if (typeof raw !== 'object' || raw === null || raw.version !== 1) invalid()
  const dims = raw.dims as GridDims
  if (!dims || !Number.isInteger(dims.cols) || !Number.isInteger(dims.rows)) invalid()
  if (typeof raw.base !== 'string' || typeof raw.overlay !== 'string') invalid()
  const palette = raw.palette as Palette
  if (!palette || !Array.isArray(palette.colors) || !Number.isInteger(palette.nextId)) invalid()
  const settings = raw.settings as ProjectSettings
  if (!settings || typeof settings.dither !== 'boolean'
    || typeof settings.alphaThreshold !== 'number' || typeof settings.overagePct !== 'number') invalid()
  const transform = raw.transform as ImageTransform
  if (!transform || typeof transform.x !== 'number' || typeof transform.y !== 'number'
    || typeof transform.scale !== 'number') invalid()
  const image = raw.image as Project['image']
  if (image !== null && (typeof image !== 'object' || typeof image.dataUrl !== 'string'
    || typeof image.width !== 'number' || typeof image.height !== 'number')) invalid()

  let base: Uint16Array, overlay: Uint16Array
  try {
    base = base64ToU16(raw.base)
    overlay = base64ToU16(raw.overlay)
  } catch {
    invalid()
  }
  const n = dims.cols * dims.rows
  if (base.length !== n || overlay.length !== n) invalid()

  return {
    version: 1, dims, palette, settings, transform, image,
    meshInches: typeof raw.meshInches === 'number' ? raw.meshInches : 2,
    base, overlay,
  }
}
