export const MAX_WORKING_SIDE = 2048

export function workingSize(w: number, h: number): { width: number; height: number } {
  const k = Math.min(1, MAX_WORKING_SIDE / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) }
}

// Detect formats browsers can't decode BEFORE trying, so the error can name
// the format (a failed decode alone can't).
export function isKnownUnsupported(file: File): string | null {
  const name = file.name.toLowerCase()
  if (file.type === 'image/heic' || file.type === 'image/heif'
    || name.endsWith('.heic') || name.endsWith('.heif')) return 'HEIC'
  return null
}

export interface LoadedImage { dataUrl: string; width: number; height: number; imageData: ImageData }

function bitmapToLoaded(bmp: ImageBitmap): LoadedImage {
  const { width, height } = workingSize(bmp.width, bmp.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0, width, height)
  bmp.close()
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width, height,
    imageData: ctx.getImageData(0, 0, width, height),
  }
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  return bitmapToLoaded(await createImageBitmap(file))
}

export async function decodeDataUrl(dataUrl: string): Promise<ImageData> {
  const blob = await (await fetch(dataUrl)).blob()
  const bmp = await createImageBitmap(blob)
  return bitmapToLoaded(bmp).imageData
}

export function sampleHeartImage(): LoadedImage {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e4002b'
  ctx.beginPath()
  ctx.moveTo(200, 260)
  ctx.bezierCurveTo(60, 160, 60, 60, 150, 60)
  ctx.bezierCurveTo(190, 60, 200, 100, 200, 100)
  ctx.bezierCurveTo(200, 100, 210, 60, 250, 60)
  ctx.bezierCurveTo(340, 60, 340, 160, 200, 260)
  ctx.fill()
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: 400, height: 300,
    imageData: ctx.getImageData(0, 0, 400, 300),
  }
}
