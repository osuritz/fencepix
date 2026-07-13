import { describe, expect, test } from 'vitest'
import {
  CLASSIC_12, addColor, createPalette, remapCells, removeColor, updateColor,
} from './palette'

describe('createPalette', () => {
  test('assigns ids 1..n and nextId n+1', () => {
    const p = createPalette(CLASSIC_12)
    expect(p.colors).toHaveLength(12)
    expect(p.colors[0].id).toBe(1)
    expect(p.colors[11].id).toBe(12)
    expect(p.nextId).toBe(13)
  })
})

describe('addColor / updateColor / removeColor', () => {
  test('add assigns nextId and bumps it', () => {
    let p = createPalette([{ name: 'Red', hex: '#ff0000' }])
    p = addColor(p, 'Blue', '#0000ff')
    expect(p.colors[1]).toEqual({ id: 2, name: 'Blue', hex: '#0000ff' })
    expect(p.nextId).toBe(3)
  })
  test('add rejects invalid hex', () => {
    const p = createPalette([])
    expect(() => addColor(p, 'Bad', 'nope')).toThrow()
  })
  test('ids are never reused after removal', () => {
    let p = createPalette([{ name: 'A', hex: '#111111' }, { name: 'B', hex: '#222222' }])
    p = removeColor(p, 2)
    expect(p.colors.map(c => c.id)).toEqual([1])
    p = addColor(p, 'C', '#333333')
    expect(p.colors.map(c => c.id)).toEqual([1, 3])
  })
  test('update patches name and hex, validates hex', () => {
    let p = createPalette([{ name: 'A', hex: '#111111' }])
    p = updateColor(p, 1, { hex: '#abcdef' })
    expect(p.colors[0].hex).toBe('#abcdef')
    expect(() => updateColor(p, 1, { hex: 'zz' })).toThrow()
  })
})

describe('remapCells', () => {
  test('replaces matching values in a copy', () => {
    const cells = Uint16Array.from([1, 2, 1, 0, 3])
    const out = remapCells(cells, 1, 9)
    expect(Array.from(out)).toEqual([9, 2, 9, 0, 3])
    expect(Array.from(cells)).toEqual([1, 2, 1, 0, 3]) // original untouched
  })
})
