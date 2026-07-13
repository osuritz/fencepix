import { describe, expect, test } from 'vitest'
import { quantize } from './quantize'
import { createPalette } from './palette'
import { EMPTY } from './grid'

// samples helper: build cells*4 Float32Array from [r,g,b,a] per cell (premult linear)
function samplesOf(cells: Array<[number, number, number, number]>): Float32Array {
  const out = new Float32Array(cells.length * 4)
  cells.forEach((c, i) => out.set(c, i * 4))
  return out
}

const rbw = createPalette([
  { name: 'Red', hex: '#ff0000' },   // id 1
  { name: 'Blue', hex: '#0000ff' },  // id 2
  { name: 'White', hex: '#ffffff' }, // id 3
])

test('pure colors snap to their palette entry', () => {
  const s = samplesOf([[1, 0, 0, 1], [0, 0, 1, 1], [1, 1, 1, 1]])
  const out = quantize(s, { cols: 3, rows: 1 }, rbw, { dither: false, alphaThreshold: 0.5 })
  expect(Array.from(out)).toEqual([1, 2, 3])
})

test('alpha below threshold yields EMPTY', () => {
  const s = samplesOf([[0.3, 0, 0, 0.3], [1, 0, 0, 1]])
  const out = quantize(s, { cols: 2, rows: 1 }, rbw, { dither: false, alphaThreshold: 0.5 })
  expect(out[0]).toBe(EMPTY)
  expect(out[1]).toBe(1)
})

test('fully transparent cells are empty even with threshold 0', () => {
  const s = samplesOf([[0, 0, 0, 0], [1, 0, 0, 1]])
  const out = quantize(s, { cols: 2, rows: 1 }, rbw, { dither: true, alphaThreshold: 0 })
  expect(out[0]).toBe(EMPTY)
  expect(out[1]).toBe(1)
})

test('empty palette yields all EMPTY', () => {
  const s = samplesOf([[1, 0, 0, 1]])
  const out = quantize(s, { cols: 1, rows: 1 }, createPalette([]), { dither: false, alphaThreshold: 0.5 })
  expect(out[0]).toBe(EMPTY)
})

describe('dithering', () => {
  const bw = createPalette([
    { name: 'Black', hex: '#000000' }, // id 1
    { name: 'White', hex: '#ffffff' }, // id 2
  ])
  const gray: [number, number, number, number] = [0.5, 0.5, 0.5, 1]

  test('mid-gray with dithering produces a mix of black and white', () => {
    const d = { cols: 10, rows: 6 }
    const s = samplesOf(Array(60).fill(gray))
    const out = quantize(s, d, bw, { dither: true, alphaThreshold: 0.5 })
    const blacks = Array.from(out).filter(v => v === 1).length
    const whites = Array.from(out).filter(v => v === 2).length
    expect(blacks).toBeGreaterThan(5)
    expect(whites).toBeGreaterThan(5)
  })

  test('without dithering mid-gray is uniform', () => {
    const d = { cols: 10, rows: 6 }
    const s = samplesOf(Array(60).fill(gray))
    const out = quantize(s, d, bw, { dither: false, alphaThreshold: 0.5 })
    expect(new Set(Array.from(out)).size).toBe(1)
  })

  test('deterministic: same input, same output', () => {
    const d = { cols: 10, rows: 6 }
    const s = samplesOf(Array(60).fill(gray))
    const a = quantize(s, d, bw, { dither: true, alphaThreshold: 0.5 })
    const b = quantize(s, d, bw, { dither: true, alphaThreshold: 0.5 })
    expect(Array.from(a)).toEqual(Array.from(b))
  })

  test('error never leaks into below-threshold cells', () => {
    const d = { cols: 2, rows: 2 }
    const s = samplesOf([gray, [0, 0, 0, 0], gray, gray])
    const out = quantize(s, d, bw, { dither: true, alphaThreshold: 0.5 })
    expect(out[1]).toBe(EMPTY)
  })
})
