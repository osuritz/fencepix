import { describe, expect, test } from 'vitest'
import { designToScreen, screenToDesign, visibleRange } from './render'

const v = { offsetX: 50, offsetY: 20, pxPerUnit: 10 }

test('designToScreen and screenToDesign are inverses', () => {
  const s = designToScreen(v, 3.5, 7)
  expect(s).toEqual({ x: 85, y: 90 })
  expect(screenToDesign(v, s.x, s.y)).toEqual({ x: 3.5, y: 7 })
})

describe('visibleRange', () => {
  test('clamps to grid bounds', () => {
    const r = visibleRange({ offsetX: 0, offsetY: 0, pxPerUnit: 10 }, 100, 100, { cols: 50, rows: 50 })
    expect(r.rowMin).toBe(0)
    expect(r.colMin).toBe(0)
    expect(r.rowMax).toBeLessThanOrEqual(11)
    expect(r.colMax).toBeLessThanOrEqual(6)
  })
  test('far-scrolled viewport yields an empty range', () => {
    const r = visibleRange({ offsetX: -10_000, offsetY: -10_000, pxPerUnit: 10 }, 100, 100, { cols: 5, rows: 5 })
    expect(r.rowMin).toBeGreaterThan(r.rowMax)
  })
})
