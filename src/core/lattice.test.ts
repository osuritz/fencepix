import { describe, expect, test } from 'vitest'
import {
  MAX_CELLS, cellAt, cellCenter, cellCount, designSize,
  gridFromPhysical, neighbors, physicalFromGrid,
} from './lattice'

describe('cellCenter', () => {
  test('even rows sit on the base column grid', () => {
    expect(cellCenter(0, 0)).toEqual({ x: 1, y: 1 })
    expect(cellCenter(0, 3)).toEqual({ x: 7, y: 1 })
    expect(cellCenter(2, 1)).toEqual({ x: 3, y: 3 })
  })
  test('odd rows are shifted +1 in x and rows are 1 unit apart', () => {
    expect(cellCenter(1, 0)).toEqual({ x: 2, y: 2 })
    expect(cellCenter(3, 2)).toEqual({ x: 6, y: 4 })
  })
})

describe('cellAt', () => {
  const dims = { cols: 4, rows: 5 }
  test('center of every cell maps back to that cell', () => {
    for (let row = 0; row < dims.rows; row++)
      for (let col = 0; col < dims.cols; col++) {
        const c = cellCenter(row, col)
        expect(cellAt(c.x, c.y, dims)).toEqual({ row, col })
      }
  })
  test('point clearly inside a diamond but off-center still maps to it', () => {
    const c = cellCenter(2, 1)
    expect(cellAt(c.x + 0.4, c.y + 0.3, dims)).toEqual({ row: 2, col: 1 })
  })
  test('points outside the grid return null', () => {
    expect(cellAt(-5, -5, dims)).toBeNull()
    expect(cellAt(999, 1, dims)).toBeNull()
  })
})

describe('neighbors', () => {
  const dims = { cols: 4, rows: 4 }
  test('even-row cell: down-left is col-1, down-right is col', () => {
    expect(neighbors(2, 2, dims)).toEqual(
      expect.arrayContaining([
        { row: 1, col: 1 }, { row: 1, col: 2 },
        { row: 3, col: 1 }, { row: 3, col: 2 },
      ]),
    )
    expect(neighbors(2, 2, dims)).toHaveLength(4)
  })
  test('odd-row cell: down-left is col, down-right is col+1', () => {
    expect(neighbors(1, 1, dims)).toEqual(
      expect.arrayContaining([
        { row: 0, col: 1 }, { row: 0, col: 2 },
        { row: 2, col: 1 }, { row: 2, col: 2 },
      ]),
    )
  })
  test('edge cells drop out-of-range neighbors', () => {
    expect(neighbors(0, 0, dims)).toEqual([
      { row: 1, col: 0 },
    ])
  })
})

describe('gridFromPhysical', () => {
  // With mesh = √2, W = H = 2 exactly: cols = floor((w-1)/2), rows = floor((h-1)/1)
  const mesh = Math.SQRT2
  test('exact unit-diamond cases', () => {
    expect(gridFromPhysical(11, 5, mesh)).toEqual({ cols: 5, rows: 4 })
    expect(gridFromPhysical(2, 2, mesh)).toEqual({ cols: 0, rows: 1 })
  })
  test('10ft x 4ft fence at 2in mesh', () => {
    expect(gridFromPhysical(120, 48, 2)).toEqual({ cols: 41, rows: 32 })
  })
  test('degenerate sizes clamp to zero', () => {
    expect(gridFromPhysical(0.5, 0.5, 2)).toEqual({ cols: 0, rows: 0 })
  })
})

describe('physicalFromGrid', () => {
  test('is the minimal size whose gridFromPhysical round-trips', () => {
    const mesh = 2
    const dims = { cols: 41, rows: 32 }
    const p = physicalFromGrid(dims, mesh)
    expect(gridFromPhysical(p.width, p.height, mesh)).toEqual(dims)
    expect(gridFromPhysical(p.width - 0.01, p.height - 0.01, mesh)).not.toEqual(dims)
  })
})

describe('cellCount / designSize / MAX_CELLS', () => {
  test('cellCount multiplies', () => {
    expect(cellCount({ cols: 41, rows: 32 })).toBe(1312)
  })
  test('MAX_CELLS is 50000', () => {
    expect(MAX_CELLS).toBe(50_000)
  })
  test('designSize covers the staggered bounding box', () => {
    expect(designSize({ cols: 3, rows: 1 })).toEqual({ width: 6, height: 2 })
    expect(designSize({ cols: 3, rows: 4 })).toEqual({ width: 7, height: 5 })
    expect(designSize({ cols: 0, rows: 0 })).toEqual({ width: 0, height: 0 })
  })
})
