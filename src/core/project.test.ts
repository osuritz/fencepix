import { describe, expect, test } from 'vitest'
import { defaultProject, deserializeProject, serializeProject } from './project'

test('defaultProject is a 41×32 grid with the Classic 12 palette', () => {
  const p = defaultProject()
  expect(p.dims).toEqual({ cols: 41, rows: 32 })
  expect(p.meshInches).toBe(2)
  expect(p.palette.colors).toHaveLength(12)
  expect(p.base).toHaveLength(41 * 32)
  expect(p.overlay).toHaveLength(41 * 32)
  expect(p.settings).toEqual({ dither: true, alphaThreshold: 0.5, overagePct: 5 })
})

test('serialize/deserialize round-trips including grid contents', () => {
  const p = defaultProject()
  p.base[0] = 5; p.base[100] = 12
  p.overlay[3] = 0xffff; p.overlay[7] = 2
  p.image = { dataUrl: 'data:image/png;base64,AAAA', width: 10, height: 8 }
  p.transform = { x: 1.5, y: -2, scale: 0.25 }
  const q = deserializeProject(serializeProject(p))
  expect(q.dims).toEqual(p.dims)
  expect(Array.from(q.base)).toEqual(Array.from(p.base))
  expect(Array.from(q.overlay)).toEqual(Array.from(p.overlay))
  expect(q.palette).toEqual(p.palette)
  expect(q.image).toEqual(p.image)
  expect(q.transform).toEqual(p.transform)
  expect(q.settings).toEqual(p.settings)
})

describe('deserialize rejects invalid input', () => {
  test('non-JSON', () => {
    expect(() => deserializeProject('not json')).toThrow('invalid project file')
  })
  test('wrong version', () => {
    const bad = JSON.parse(serializeProject(defaultProject()))
    bad.version = 2
    expect(() => deserializeProject(JSON.stringify(bad))).toThrow('invalid project file')
  })
  test('grid length mismatch', () => {
    const bad = JSON.parse(serializeProject(defaultProject()))
    bad.dims.cols = 5
    expect(() => deserializeProject(JSON.stringify(bad))).toThrow('invalid project file')
  })
  test('missing palette', () => {
    const bad = JSON.parse(serializeProject(defaultProject()))
    delete bad.palette
    expect(() => deserializeProject(JSON.stringify(bad))).toThrow('invalid project file')
  })
  test('malformed palette entries', () => {
    const bad = JSON.parse(serializeProject(defaultProject()))
    bad.palette.colors[0] = {}
    expect(() => deserializeProject(JSON.stringify(bad))).toThrow('invalid project file')
  })
})
