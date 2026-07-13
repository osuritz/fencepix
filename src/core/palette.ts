import { hexToRgb } from './color'

export interface PaletteColor { id: number; name: string; hex: string }
export interface Palette { colors: PaletteColor[]; nextId: number }

export const MAX_COLOR_ID = 0xfffe // 0 = empty, 0xffff = overlay eraser

// Put-in-Cups-style preset.
export const CLASSIC_12: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'White', hex: '#f4f4f4' },
  { name: 'Yellow', hex: '#ffd100' },
  { name: 'Orange', hex: '#ff7900' },
  { name: 'Red', hex: '#e4002b' },
  { name: 'Pink', hex: '#f57eb6' },
  { name: 'Purple', hex: '#753bbd' },
  { name: 'Royal Blue', hex: '#1d4f91' },
  { name: 'Sky Blue', hex: '#71c5e8' },
  { name: 'Green', hex: '#00a651' },
  { name: 'Dark Green', hex: '#00594c' },
  { name: 'Brown', hex: '#6e4c1e' },
  { name: 'Black', hex: '#1a1a1a' },
]

export function createPalette(entries: ReadonlyArray<{ name: string; hex: string }>): Palette {
  return {
    colors: entries.map((e, i) => ({ id: i + 1, name: e.name, hex: e.hex })),
    nextId: entries.length + 1,
  }
}

export function addColor(p: Palette, name: string, hex: string): Palette {
  hexToRgb(hex) // validate
  if (p.nextId > MAX_COLOR_ID) throw new Error('palette id space exhausted')
  return { colors: [...p.colors, { id: p.nextId, name, hex }], nextId: p.nextId + 1 }
}

export function updateColor(p: Palette, id: number, patch: { name?: string; hex?: string }): Palette {
  if (patch.hex !== undefined) hexToRgb(patch.hex)
  return { ...p, colors: p.colors.map(c => (c.id === id ? { ...c, ...patch } : c)) }
}

export function removeColor(p: Palette, id: number): Palette {
  return { ...p, colors: p.colors.filter(c => c.id !== id) }
}

export function remapCells(cells: Uint16Array, from: number, to: number): Uint16Array {
  const out = cells.slice()
  for (let i = 0; i < out.length; i++) if (out[i] === from) out[i] = to
  return out
}
