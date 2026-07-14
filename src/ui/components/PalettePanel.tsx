import { useState } from 'react'
import { useStore } from '../store'
import { composite } from '../../core/grid'
import { CLASSIC_12 } from '../../core/palette'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const selectClass =
  'h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

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
    <div className="flex flex-col gap-2 border-b p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Palette</h3>
      <ul className="flex flex-col gap-1">
        {palette.colors.map(c => (
          <li key={c.id} className="flex items-center gap-1">
            <button
              className="size-[22px] shrink-0 cursor-pointer rounded-sm border border-border aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-1"
              style={{ background: c.hex }}
              aria-pressed={selectedColorId === c.id}
              aria-label={`select ${c.name}`}
              onClick={() => useStore.getState().selectColor(c.id)}
            />
            <input
              type="color" value={c.hex} aria-label={`${c.name} hex`}
              className="h-7 w-8 cursor-pointer rounded border border-input bg-transparent p-0.5"
              onChange={e => useStore.getState().paletteUpdate(c.id, { hex: e.target.value })}
            />
            <Input
              value={c.name} aria-label={`${c.name} name`}
              className="h-8 w-24 text-sm"
              onChange={e => useStore.getState().paletteUpdate(c.id, { name: e.target.value })}
            />
            <Button variant="outline" size="icon-sm" aria-label={`remove ${c.name}`} onClick={() => requestRemove(c.id)}>✕</Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={() => useStore.getState().paletteAdd('New color', '#888888')}>Add color</Button>
      <Button variant="outline" size="sm" onClick={() => {
        if (window.confirm('Reset the palette to Classic 12? Custom colors are removed.')) {
          useStore.getState().paletteLoadPreset()
        }
      }}>
        Reset to Classic 12 ({CLASSIC_12.length} colors)
      </Button>
      {removing !== null && (
        <div className="flex flex-col gap-1.5 rounded-md border border-destructive/50 p-2">
          <p className="text-sm">This color is used in the design.</p>
          <Label className="flex flex-col items-start gap-1 text-xs font-normal text-foreground">
            Replace with
            <select className={selectClass} value={remapTo} onChange={e => setRemapTo(e.target.value)}>
              <option value="empty">Clear to empty</option>
              {palette.colors.filter(c => c.id !== removing).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Label>
          <div className="flex gap-1">
            <Button variant="default" size="sm" onClick={() => {
              useStore.getState().paletteRemove(removing, remapTo === 'empty' ? null : +remapTo)
              setRemoving(null)
            }}>Confirm</Button>
            <Button variant="outline" size="sm" onClick={() => setRemoving(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
