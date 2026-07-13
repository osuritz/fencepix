import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { designSize } from '../../core/lattice'
import { isKnownUnsupported, loadImageFile, sampleHeartImage } from '../imageLoad'

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
    <div className="panel">
      <h3>Image</h3>
      <div
        className="dropzone"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) void onFile(file)
        }}
      >
        <label>
          Choose image
          <input
            type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f) }}
          />
        </label>
        <p>or drag & drop / paste</p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {!image && (
        <button onClick={() => {
          const s = sampleHeartImage()
          useStore.getState().setImage({ dataUrl: s.dataUrl, width: s.width, height: s.height }, s.imageData)
        }}>
          Try a sample image
        </button>
      )}
      {image && (
        <div className="image-controls">
          <button onClick={() => zoomImage(1.1)}>Bigger</button>
          <button onClick={() => zoomImage(1 / 1.1)}>Smaller</button>
          <button onClick={() => nudge(-step, 0)}>←</button>
          <button onClick={() => nudge(step, 0)}>→</button>
          <button onClick={() => nudge(0, -step)}>↑</button>
          <button onClick={() => nudge(0, step)}>↓</button>
          <button onClick={() => useStore.getState().fitImage()}>Fit</button>
        </div>
      )}
    </div>
  )
}
