import { expect, test } from 'vitest'
import { shoppingList } from './shopping'

test('counts per color, skipping empty, sorted by count desc then id', () => {
  const cells = Uint16Array.from([1, 2, 2, 0, 3, 2, 3, 0])
  const list = shoppingList(cells, 0)
  expect(list).toEqual([
    { colorId: 2, count: 3, withOverage: 3 },
    { colorId: 3, count: 2, withOverage: 2 },
    { colorId: 1, count: 1, withOverage: 1 },
  ])
})

test('overage rounds up per color', () => {
  const cells = new Uint16Array(21).fill(7)
  expect(shoppingList(cells, 5)[0].withOverage).toBe(23) // ceil(21·1.05) = ceil(22.05)
})

test('all-empty grid yields empty list', () => {
  expect(shoppingList(new Uint16Array(10), 5)).toEqual([])
})
