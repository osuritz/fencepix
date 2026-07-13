import { describe, expect, test } from 'vitest'
import { EMPTY, OVERLAY_EMPTY, UNTOUCHED, cellIndex, composite, createCells } from './grid'

test('createCells is zero-filled with rows*cols entries', () => {
  const cells = createCells({ cols: 3, rows: 2 })
  expect(cells).toHaveLength(6)
  expect(Array.from(cells)).toEqual([0, 0, 0, 0, 0, 0])
})

test('cellIndex is row-major', () => {
  const d = { cols: 4, rows: 3 }
  expect(cellIndex(0, 0, d)).toBe(0)
  expect(cellIndex(1, 2, d)).toBe(6)
  expect(cellIndex(2, 3, d)).toBe(11)
})

describe('composite', () => {
  test('untouched defers to base, colors win, eraser empties', () => {
    const base = Uint16Array.from([5, 5, EMPTY, 7])
    const overlay = Uint16Array.from([UNTOUCHED, 9, 3, OVERLAY_EMPTY])
    expect(Array.from(composite(base, overlay))).toEqual([5, 9, 3, EMPTY])
  })
  test('does not mutate inputs', () => {
    const base = Uint16Array.from([1])
    const overlay = Uint16Array.from([2])
    composite(base, overlay)
    expect(base[0]).toBe(1)
  })
})
