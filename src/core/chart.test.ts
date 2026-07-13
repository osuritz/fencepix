import { expect, test } from 'vitest'
import { PAGE_COLS, PAGE_ROWS, paginate } from './chart'

test('page size constants match the spec decision', () => {
  expect(PAGE_COLS).toBe(25)
  expect(PAGE_ROWS).toBe(30)
})

test('small grid fits one page', () => {
  expect(paginate({ cols: 10, rows: 8 })).toEqual([
    { pageRow: 0, pageCol: 0, rowStart: 0, rowEnd: 8, colStart: 0, colEnd: 10 },
  ])
})

test('60×70 grid paginates 3×3 with clamped last pages', () => {
  const pages = paginate({ cols: 60, rows: 70 })
  expect(pages).toHaveLength(9)
  expect(pages[0]).toEqual({ pageRow: 0, pageCol: 0, rowStart: 0, rowEnd: 30, colStart: 0, colEnd: 25 })
  expect(pages[2]).toEqual({ pageRow: 0, pageCol: 2, rowStart: 0, rowEnd: 30, colStart: 50, colEnd: 60 })
  expect(pages[8]).toEqual({ pageRow: 2, pageCol: 2, rowStart: 60, rowEnd: 70, colStart: 50, colEnd: 60 })
})

test('empty grid yields no pages', () => {
  expect(paginate({ cols: 0, rows: 0 })).toEqual([])
})
