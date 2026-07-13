import { useStore, type Tool } from '../store'

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'paint', label: 'Paint' },
  { id: 'erase', label: 'Erase' },
  { id: 'eyedropper', label: 'Pick color' },
]

export function Toolbar() {
  const tool = useStore(s => s.tool)
  const selectedColorId = useStore(s => s.selectedColorId)
  const palette = useStore(s => s.project.palette)
  const canUndo = useStore(s => s.undoStack.length > 0)
  const canRedo = useStore(s => s.redoStack.length > 0)
  const selected = palette.colors.find(c => c.id === selectedColorId)

  return (
    <div className="toolbar">
      {TOOLS.map(t => (
        <button key={t.id} aria-pressed={tool === t.id}
          onClick={() => useStore.getState().setTool(t.id)}>
          {t.label}
        </button>
      ))}
      <span className="current-color" title={selected?.name ?? 'no color selected'}
        style={{ background: selected?.hex ?? 'transparent' }} />
      <button disabled={!canUndo} onClick={() => useStore.getState().undo()}>Undo</button>
      <button disabled={!canRedo} onClick={() => useStore.getState().redo()}>Redo</button>
      <span className="hint">scroll = zoom · space-drag = pan</span>
    </div>
  )
}
