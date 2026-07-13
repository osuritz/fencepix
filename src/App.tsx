import { useEffect, useState } from 'react'
import { useStore } from './ui/store'
import { loadAutosave, saveAutosave } from './ui/persist'
import { deserializeProject, serializeProject } from './core/project'
import { decodeDataUrl } from './ui/imageLoad'
import { FenceSetupPanel } from './ui/components/FenceSetupPanel'
import { ImagePanel } from './ui/components/ImagePanel'
import { PalettePanel } from './ui/components/PalettePanel'
import { PixelationPanel } from './ui/components/PixelationPanel'
import { FenceCanvas } from './ui/components/FenceCanvas'
import { Toolbar } from './ui/components/Toolbar'
import { ShoppingListTab } from './ui/components/ShoppingListTab'
import { ExportTab } from './ui/components/ExportTab'
import { PrintChart } from './ui/components/PrintChart'

export default function App() {
  const [tab, setTab] = useState<'shopping' | 'export'>('shopping')
  const [showChart, setShowChart] = useState(false)
  const [restored, setRestored] = useState(false)
  const autosaveError = useStore(s => s.autosaveError)

  // Restore autosave once on startup; any failure just starts fresh.
  useEffect(() => {
    void (async () => {
      try {
        const json = await loadAutosave()
        if (json) {
          const p = deserializeProject(json)
          const data = p.image ? await decodeDataUrl(p.image.dataUrl) : null
          useStore.getState().loadProject(p, data)
        }
      } catch {
        // corrupted or unavailable autosave — start fresh
      }
      setRestored(true)
    })()
  }, [])

  // Debounced autosave on every project revision.
  useEffect(() => {
    if (!restored) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = useStore.subscribe((s, prev) => {
      if (s.revision === prev.revision) return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          await saveAutosave(serializeProject(useStore.getState().project))
          useStore.getState().setAutosaveError(false)
        } catch {
          useStore.getState().setAutosaveError(true)
        }
      }, 800)
    })
    return () => { unsub(); clearTimeout(timer) }
  }, [restored])

  // Cross-platform undo/redo shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useStore.getState().redo()
        else useStore.getState().undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <FenceSetupPanel />
          <ImagePanel />
          <PalettePanel />
          <PixelationPanel />
        </aside>
        <main className="canvas-area">
          <Toolbar />
          <FenceCanvas />
        </main>
        <section className="output-panel">
          <nav>
            <button aria-pressed={tab === 'shopping'} onClick={() => setTab('shopping')}>Shopping list</button>
            <button aria-pressed={tab === 'export'} onClick={() => setTab('export')}>Export</button>
            <button onClick={() => setShowChart(true)}>Print chart</button>
          </nav>
          {tab === 'shopping' ? <ShoppingListTab /> : <ExportTab />}
        </section>
      </div>
      {autosaveError && (
        <div className="autosave-banner" role="alert">
          Couldn't autosave — use Export to keep your work.
        </div>
      )}
      {showChart && <PrintChart onClose={() => setShowChart(false)} />}
    </>
  )
}
