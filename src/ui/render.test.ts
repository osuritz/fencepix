import { describe, expect, test } from 'vitest'
import { DEFAULT_VIEW, designToScreen, fitView, panBy, screenToDesign, visibleRange, zoomAt } from './render'

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

describe('panBy', () => {
  test('moves offsets opposite the scroll deltas', () => {
    expect(panBy(v, 10, -5)).toEqual({ offsetX: 40, offsetY: 25, pxPerUnit: 10 })
  })
})

describe('zoomAt', () => {
  test('keeps the design point under the anchor fixed', () => {
    const v2 = zoomAt(v, 200, 150, 2)
    expect(v2.pxPerUnit).toBe(20)
    const before = screenToDesign(v, 200, 150)
    const after = screenToDesign(v2, 200, 150)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
  test('clamps at both ends', () => {
    expect(zoomAt(v, 0, 0, 1000).pxPerUnit).toBe(100)
    expect(zoomAt(v, 0, 0, 0.0001).pxPerUnit).toBe(2)
  })
})

describe('fitView', () => {
  test('fits the limiting axis with 5% padding and centers', () => {
    // designSize({cols:41, rows:32}) = { width: 83, height: 33 }
    const view = fitView({ cols: 41, rows: 32 }, 830, 660)
    expect(view.pxPerUnit).toBeCloseTo(9.5) // min(830/83, 660/33) * 0.95 = 10 * 0.95
    expect(view.offsetX).toBeCloseTo((830 - 83 * 9.5) / 2)
    expect(view.offsetY).toBeCloseTo((660 - 33 * 9.5) / 2)
  })
  test('degenerate dims fall back to the default view', () => {
    expect(fitView({ cols: 0, rows: 0 }, 800, 600)).toEqual(DEFAULT_VIEW)
  })
})
