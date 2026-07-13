import { useState } from 'react'
import { useStore } from '../store'
import { deserializeProject, serializeProject } from '../../core/project'
import { decodeDataUrl } from '../imageLoad'
import { renderPngBlob } from '../exportPng'

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportTab() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="panel">
      <button onClick={async () => {
        try {
          downloadBlob(await renderPngBlob(useStore.getState().project), 'fencepix.png')
        } catch { setError('PNG export failed.') }
      }}>
        Download PNG
      </button>
      <button onClick={() => {
        const json = serializeProject(useStore.getState().project)
        downloadBlob(new Blob([json], { type: 'application/json' }), 'design.fencepix.json')
      }}>
        Download project
      </button>
      <label>Import project
        <input type="file" accept=".json,application/json" hidden
          onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              const p = deserializeProject(await file.text())
              const data = p.image ? await decodeDataUrl(p.image.dataUrl) : null
              useStore.getState().loadProject(p, data)
              setError(null)
            } catch {
              setError("That file isn't a valid fencepix project.")
            }
          }} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
