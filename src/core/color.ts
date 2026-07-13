export interface RGB { r: number; g: number; b: number } // 0-255 sRGB
export interface OKLab { L: number; a: number; b: number }

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`invalid hex color: ${hex}`)
  const n = parseInt(m[1], 16)
  return { r: n >> 16, g: (n >> 8) & 0xff, b: n & 0xff }
}

export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.min(1, Math.max(0, v))
}

// Björn Ottosson's reference OKLab conversion (linear sRGB input).
export function linearRgbToOklab(r: number, g: number, b: number): OKLab {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}

export function hexToLinear(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex)
  return [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)]
}

export function hexToOklab(hex: string): OKLab {
  const [r, g, b] = hexToLinear(hex)
  return linearRgbToOklab(r, g, b)
}

export function oklabDistSq(x: OKLab, y: OKLab): number {
  const dL = x.L - y.L, da = x.a - y.a, db = x.b - y.b
  return dL * dL + da * da + db * db
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToLinear(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
