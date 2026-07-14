import { useState } from 'react'
import { useStore } from '../store'
import { deserializeProject, serializeProject } from '../../core/project'
import { decodeDataUrl } from '../imageLoad'
import { renderPngBlob } from '../exportPng'
import { Button } from '@/components/ui/button'

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
    <div className="flex flex-col gap-2 p-3">
      <Button variant="outline" size="sm" onClick={async () => {
        try {
          downloadBlob(await renderPngBlob(useStore.getState().project), 'fencepix.png')
        } catch { setError('PNG export failed.') }
      }}>
        Download PNG
      </Button>
      <Button variant="outline" size="sm" onClick={() => {
        const json = serializeProject(useStore.getState().project)
        downloadBlob(new Blob([json], { type: 'application/json' }), 'design.fencepix.json')
      }}>
        Download project
      </Button>
      <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-2.5 text-sm shadow-xs hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
        Import project
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
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}
