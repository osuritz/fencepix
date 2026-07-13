import { describe, expect, test } from 'vitest'
import {
  hexToLinear, hexToOklab, hexToRgb, linearRgbToOklab, linearToSrgb,
  luminance, oklabDistSq, rgbToHex, srgbToLinear,
} from './color'

describe('hex parsing', () => {
  test('parses with and without #', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 })
    expect(hexToRgb('FF8000')).toEqual({ r: 255, g: 128, b: 0 })
  })
  test('throws on garbage', () => {
    expect(() => hexToRgb('#ff80')).toThrow()
    expect(() => hexToRgb('red')).toThrow()
  })
  test('round-trips through rgbToHex', () => {
    expect(rgbToHex(hexToRgb('#1a2b3c'))).toBe('#1a2b3c')
  })
})

describe('sRGB transfer', () => {
  test('linear round-trip', () => {
    for (const v of [0, 0.04, 0.2, 0.5, 0.99, 1]) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6)
    }
  })
  test('known value: sRGB 0.5 is ~0.2140 linear', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.21404, 4)
  })
})

describe('OKLab', () => {
  test('white is L=1, a=b=0', () => {
    const lab = linearRgbToOklab(1, 1, 1)
    expect(lab.L).toBeCloseTo(1, 3)
    expect(lab.a).toBeCloseTo(0, 3)
    expect(lab.b).toBeCloseTo(0, 3)
  })
  test('black is L=0', () => {
    expect(linearRgbToOklab(0, 0, 0).L).toBeCloseTo(0, 3)
  })
  test('red and blue are far apart, red and dark red are closer', () => {
    const red = hexToOklab('#ff0000')
    const darkRed = hexToOklab('#990000')
    const blue = hexToOklab('#0000ff')
    expect(oklabDistSq(red, darkRed)).toBeLessThan(oklabDistSq(red, blue))
  })
})

describe('helpers', () => {
  test('hexToLinear', () => {
    const [r, g, b] = hexToLinear('#ffffff')
    expect(r).toBeCloseTo(1); expect(g).toBeCloseTo(1); expect(b).toBeCloseTo(1)
  })
  test('luminance orders black < gray < white', () => {
    expect(luminance('#000000')).toBeLessThan(luminance('#808080'))
    expect(luminance('#808080')).toBeLessThan(luminance('#ffffff'))
  })
})
