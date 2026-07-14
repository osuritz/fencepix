import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { designSize } from '../../core/lattice'
import { isKnownUnsupported, loadImageFile, sampleHeartImage } from '../imageLoad'
import { Button } from '@/components/ui/button'

export function ImagePanel() {
  const image = useStore(s => s.project.image)
  const transform = useStore(s => s.project.transform)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File) {
    const unsupported = isKnownUnsupported(file)
    if (unsupported) {
      setError(`${unsupported} isn't supported by browsers — export it as JPG or PNG first.`)
      return
    }
    const { project } = useStore.getState()
    if (project.image && project.overlay.some(v => v !== 0)
      && !window.confirm('Load a new image? Your manual edits will stay but may no longer match it.')) return
    try {
      const loaded = await loadImageFile(file)
      setError(null)
      useStore.getState().setImage(
        { dataUrl: loaded.dataUrl, width: loaded.width, height: loaded.height },
        loaded.imageData,
      )
    } catch {
      setError("Couldn't read this image.")
    }
  }

  // Paste-from-clipboard support.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0]
      if (file) void onFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  function nudge(dx: number, dy: number) {
    useStore.getState().setTransform({ ...transform, x: transform.x + dx, y: transform.y + dy })
  }
  function zoomImage(f: number) {
    const ds = designSize(useStore.getState().project.dims)
    const cx = ds.width / 2, cy = ds.height / 2
    useStore.getState().setTransform({
      scale: transform.scale * f,
      x: cx - (cx - transform.x) * f,
      y: cy - (cy - transform.y) * f,
    })
  }
  const step = designSize(useStore.getState().project.dims).width * 0.05

  return (
    <div className="flex flex-col gap-2 border-b p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image</h3>
      <div
        className="rounded-md border-2 border-dashed border-muted-foreground/40 p-3 text-center text-sm text-muted-foreground"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) void onFile(file)
        }}
      >
        <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-2.5 text-sm shadow-xs hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
          Choose image
          <input
            type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f) }}
          />
        </label>
        <p className="mt-1">or drag & drop / paste</p>
      </div>
      {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
      {!image && (
        <Button variant="outline" size="sm" onClick={() => {
          const s = sampleHeartImage()
          useStore.getState().setImage({ dataUrl: s.dataUrl, width: s.width, height: s.height }, s.imageData)
        }}>
          Try a sample image
        </Button>
      )}
      {image && (
        <div className="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" onClick={() => zoomImage(1.1)}>Bigger</Button>
          <Button variant="outline" size="sm" onClick={() => zoomImage(1 / 1.1)}>Smaller</Button>
          <Button variant="outline" size="sm" onClick={() => nudge(-step, 0)}>←</Button>
          <Button variant="outline" size="sm" onClick={() => nudge(step, 0)}>→</Button>
          <Button variant="outline" size="sm" onClick={() => nudge(0, -step)}>↑</Button>
          <Button variant="outline" size="sm" onClick={() => nudge(0, step)}>↓</Button>
          <Button variant="outline" size="sm" onClick={() => useStore.getState().fitImage()}>Fit</Button>
        </div>
      )}
    </div>
  )
}
