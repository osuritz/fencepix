import type { GridDims } from './lattice'
import { EMPTY } from './grid'
import { hexToLinear, hexToOklab, linearRgbToOklab, oklabDistSq, type OKLab } from './color'
import type { Palette } from './palette'

export interface QuantizeOptions { dither: boolean; alphaThreshold: number }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function quantize(
  samples: Float32Array, d: GridDims, palette: Palette, opts: QuantizeOptions,
): Uint16Array {
  const n = d.cols * d.rows
  const out = new Uint16Array(n)
  if (palette.colors.length === 0) return out

  const ids = palette.colors.map(c => c.id)
  const labs: OKLab[] = palette.colors.map(c => hexToOklab(c.hex))
  const lin = palette.colors.map(c => hexToLinear(c.hex))
  const err = new Float32Array(n * 3)

  for (let row = 0; row < d.rows; row++) {
    const ltr = row % 2 === 0 // serpentine scan
    const shift = row % 2
    for (let k = 0; k < d.cols; k++) {
      const col = ltr ? k : d.cols - 1 - k
      const i = row * d.cols + col
      const a = samples[i * 4 + 3]
      if (a < opts.alphaThreshold || a === 0) { out[i] = EMPTY; continue }

      const r = clamp01(samples[i * 4] / a + err[i * 3])
      const g = clamp01(samples[i * 4 + 1] / a + err[i * 3 + 1])
      const b = clamp01(samples[i * 4 + 2] / a + err[i * 3 + 2])

      const lab = linearRgbToOklab(r, g, b)
      let best = 0, bd = Infinity
      for (let p = 0; p < labs.length; p++) {
        const dd = oklabDistSq(lab, labs[p])
        if (dd < bd) { bd = dd; best = p }
      }
      out[i] = ids[best]
      if (!opts.dither) continue

      const er = r - lin[best][0], eg = g - lin[best][1], eb = b - lin[best][2]
      const targets = [
        { row, col: ltr ? col + 1 : col - 1, w: 7 / 16 },      // next in scan direction
        { row: row + 1, col: col - 1 + shift, w: 4 / 16 },     // down-left
        { row: row + 1, col: col + shift, w: 5 / 16 },         // down-right
      ]
      for (const t of targets) {
        if (t.row < 0 || t.row >= d.rows || t.col < 0 || t.col >= d.cols) continue
        const j = t.row * d.cols + t.col
        const ta = samples[j * 4 + 3]
        if (ta < opts.alphaThreshold || ta === 0) continue // empty cells get no error
        err[j * 3] += er * t.w
        err[j * 3 + 1] += eg * t.w
        err[j * 3 + 2] += eb * t.w
      }
    }
  }
  return out
}
