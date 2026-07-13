import { cellCenter, type GridDims } from './lattice'
import { srgbToLinear } from './color'

export interface ImageTransform { x: number; y: number; scale: number }
export interface SourceImage { data: Uint8ClampedArray; width: number; height: number }

const K = 8 // supersample points per axis per cell

// Per spec: average premultiplied-alpha linear-light RGB over each diamond's
// footprint; sample points outside the image count as fully transparent.
export function sampleImage(img: SourceImage, t: ImageTransform, d: GridDims): Float32Array {
  const out = new Float32Array(d.cols * d.rows * 4)
  const step = 2 / K
  const linear = new Float32Array(256)
  for (let i = 0; i < 256; i++) linear[i] = srgbToLinear(i / 255)

  for (let row = 0; row < d.rows; row++) {
    for (let col = 0; col < d.cols; col++) {
      const c = cellCenter(row, col)
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let iy = 0; iy < K; iy++) {
        for (let ix = 0; ix < K; ix++) {
          const sx = c.x - 1 + (ix + 0.5) * step
          const sy = c.y - 1 + (iy + 0.5) * step
          if (Math.abs(sx - c.x) + Math.abs(sy - c.y) > 1) continue // outside diamond
          n++
          const px = Math.floor((sx - t.x) / t.scale)
          const py = Math.floor((sy - t.y) / t.scale)
          if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue
          const o = (py * img.width + px) * 4
          const alpha = img.data[o + 3] / 255
          r += linear[img.data[o]] * alpha
          g += linear[img.data[o + 1]] * alpha
          b += linear[img.data[o + 2]] * alpha
          a += alpha
        }
      }
      const base = (row * d.cols + col) * 4
      if (n > 0) {
        out[base] = r / n
        out[base + 1] = g / n
        out[base + 2] = b / n
        out[base + 3] = a / n
      }
    }
  }
  return out
}
