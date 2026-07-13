import { describe, expect, test } from 'vitest'
import { sampleImage, type SourceImage } from './sample'

function solidImage(w: number, h: number, rgba: [number, number, number, number]): SourceImage {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) data.set(rgba, i * 4)
  return { data, width: w, height: h }
}

const oneCell = { cols: 1, rows: 1 } // its diamond spans design (0,0)..(2,2), center (1,1)

test('opaque red image covering the whole diamond averages to linear red', () => {
  const img = solidImage(4, 4, [255, 0, 0, 255])
  // scale 0.5: 4px image → 2 design units, exactly covering the cell
  const out = sampleImage(img, { x: 0, y: 0, scale: 0.5 }, oneCell)
  expect(out[0]).toBeCloseTo(1, 5)   // premult linear R
  expect(out[1]).toBeCloseTo(0, 5)
  expect(out[2]).toBeCloseTo(0, 5)
  expect(out[3]).toBeCloseTo(1, 5)   // alpha
})

test('image far away yields fully transparent cell', () => {
  const img = solidImage(4, 4, [255, 255, 255, 255])
  const out = sampleImage(img, { x: 100, y: 100, scale: 0.5 }, oneCell)
  expect(out[3]).toBe(0)
})

test('image covering the left half yields roughly half alpha', () => {
  const img = solidImage(2, 4, [0, 255, 0, 255])
  // scale 0.5: 2×4 px → 1×2 design units, covering x∈[0,1) — left half of the diamond
  const out = sampleImage(img, { x: 0, y: 0, scale: 0.5 }, oneCell)
  expect(out[3]).toBeGreaterThan(0.3)
  expect(out[3]).toBeLessThan(0.7)
})

test('semi-transparent pixels premultiply', () => {
  const img = solidImage(4, 4, [255, 0, 0, 128])
  const out = sampleImage(img, { x: 0, y: 0, scale: 0.5 }, oneCell)
  expect(out[3]).toBeCloseTo(128 / 255, 2)
  expect(out[0]).toBeCloseTo(128 / 255, 2) // linear(1.0) · alpha
})

test('multi-cell grids sample each diamond from its own region', () => {
  // 8×4 px image, left half red, right half blue; two columns of one row
  const img = solidImage(8, 4, [255, 0, 0, 255])
  for (let py = 0; py < 4; py++)
    for (let px = 4; px < 8; px++)
      img.data.set([0, 0, 255, 255], (py * 8 + px) * 4)
  const out = sampleImage(img, { x: 0, y: 0, scale: 0.5 }, { cols: 2, rows: 1 })
  expect(out[0]).toBeGreaterThan(out[2])     // cell 0 more red than blue
  expect(out[4 + 2]).toBeGreaterThan(out[4]) // cell 1 more blue than red
})
