import { useState } from 'react'
import { useStore } from '../store'
import { composite } from '../../core/grid'
import { CLASSIC_12 } from '../../core/palette'

export function PalettePanel() {
  const palette = useStore(s => s.project.palette)
  const selectedColorId = useStore(s => s.selectedColorId)
  const [removing, setRemoving] = useState<number | null>(null)
  const [remapTo, setRemapTo] = useState<string>('empty')

  function requestRemove(id: number) {
    const { project } = useStore.getState()
    const used = composite(project.base, project.overlay).includes(id)
    if (!used) {
      useStore.getState().paletteRemove(id, null)
      return
    }
    setRemapTo('empty')
    setRemoving(id)
  }

  return (
    <div className="panel">
      <h3>Palette</h3>
      <ul className="palette-list">
        {palette.colors.map(c => (
          <li key={c.id} className="palette-chip">
            <button
              className="swatch"
              style={{ background: c.hex }}
              aria-pressed={selectedColorId === c.id}
              aria-label={`select ${c.name}`}
              onClick={() => useStore.getState().selectColor(c.id)}
            />
            <input
              type="color" value={c.hex} aria-label={`${c.name} hex`}
              onChange={e => useStore.getState().paletteUpdate(c.id, { hex: e.target.value })}
            />
            <input
              value={c.name} aria-label={`${c.name} name`}
              onChange={e => useStore.getState().paletteUpdate(c.id, { name: e.target.value })}
            />
            <button aria-label={`remove ${c.name}`} onClick={() => requestRemove(c.id)}>✕</button>
          </li>
        ))}
      </ul>
      <button onClick={() => useStore.getState().paletteAdd('New color', '#888888')}>Add color</button>
      <button onClick={() => {
        if (window.confirm('Reset the palette to Classic 12? Custom colors are removed.')) {
          useStore.getState().paletteLoadPreset()
        }
      }}>
        Reset to Classic 12 ({CLASSIC_12.length} colors)
      </button>
      {removing !== null && (
        <div className="remap-dialog">
          <p>This color is used in the design.</p>
          <label>Replace with
            <select value={remapTo} onChange={e => setRemapTo(e.target.value)}>
              <option value="empty">Clear to empty</option>
              {palette.colors.filter(c => c.id !== removing).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <button onClick={() => {
            useStore.getState().paletteRemove(removing, remapTo === 'empty' ? null : +remapTo)
            setRemoving(null)
          }}>Confirm</button>
          <button onClick={() => setRemoving(null)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
