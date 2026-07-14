import { gridFromPhysical, MAX_CELLS, type GridDims } from './lattice'
import { createCells } from './grid'
import { CLASSIC_12, createPalette, MAX_COLOR_ID, type Palette } from './palette'
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
  // Bounds-check dims before touching the (attacker-controlled) grid
  // payloads below, so an oversized/negative grid is rejected up front
  // regardless of what base/overlay contain.
  if (dims.cols < 0 || dims.rows < 0 || dims.cols * dims.rows > MAX_CELLS) invalid()
  if (typeof raw.base !== 'string' || typeof raw.overlay !== 'string') invalid()
  const palette = raw.palette as Palette
  if (!palette || !Array.isArray(palette.colors) || !Number.isInteger(palette.nextId)
    || palette.colors.some(c => !c || !Number.isInteger(c.id)
      || typeof c.name !== 'string' || typeof c.hex !== 'string')) invalid()
  if (palette.colors.some(c => c.id < 1 || c.id > MAX_COLOR_ID)
    || palette.nextId <= Math.max(0, ...palette.colors.map(c => c.id))) invalid()
  const settings = raw.settings as ProjectSettings
  if (!settings || typeof settings.dither !== 'boolean'
    || typeof settings.alphaThreshold !== 'number' || typeof settings.overagePct !== 'number') invalid()
  if (settings.alphaThreshold < 0 || settings.alphaThreshold > 1 || !(settings.overagePct >= 0)) invalid()
  const transform = raw.transform as ImageTransform
  if (!transform || typeof transform.x !== 'number' || typeof transform.y !== 'number'
    || typeof transform.scale !== 'number') invalid()
  if (!Number.isFinite(transform.x) || !Number.isFinite(transform.y)
    || !Number.isFinite(transform.scale) || transform.scale <= 0) invalid()
  const image = raw.image as Project['image']
  if (image !== null && (typeof image !== 'object' || typeof image.dataUrl !== 'string'
    || typeof image.width !== 'number' || typeof image.height !== 'number')) invalid()
  // Reject non-data URLs: without this, a crafted project file with an
  // https:// dataUrl makes the app fetch an attacker-controlled host on import.
  if (image !== null && !image.dataUrl.startsWith('data:image/')) invalid()

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
