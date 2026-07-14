import { useEffect, useState } from 'react'
import { MAX_CELLS, gridFromPhysical, physicalFromGrid } from '../../core/lattice'
import { useStore } from '../store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const UNIT_INCHES = { ft: 12, m: 39.3701 } as const
type Unit = keyof typeof UNIT_INCHES
const MESH_PRESETS = [2, 2.25, 2.375]

const fieldLabel = 'flex flex-col items-start gap-1 text-xs font-normal text-foreground'
const selectClass =
  'h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function FenceSetupPanel() {
  const dims = useStore(s => s.project.dims)
  const meshInches = useStore(s => s.project.meshInches)
  const [unit, setUnit] = useState<Unit>('ft')
  const [mesh, setMesh] = useState(meshInches)
  const [cols, setCols] = useState(dims.cols)
  const [rows, setRows] = useState(dims.rows)
  const initial = physicalFromGrid(dims, meshInches)
  const [width, setWidth] = useState(+(initial.width / UNIT_INCHES.ft).toFixed(2))
  const [height, setHeight] = useState(+(initial.height / UNIT_INCHES.ft).toFixed(2))

  // Resync the local mirrors when the project grid changes externally
  // (autosave restore, project import, or our own Apply).
  useEffect(() => {
    setCols(dims.cols)
    setRows(dims.rows)
    setMesh(meshInches)
    const p = physicalFromGrid(dims, meshInches)
    setWidth(+(p.width / UNIT_INCHES[unit]).toFixed(2))
    setHeight(+(p.height / UNIT_INCHES[unit]).toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims, meshInches])

  function fromPhysical(w: number, h: number, m: number, u: Unit) {
    const d = gridFromPhysical(w * UNIT_INCHES[u], h * UNIT_INCHES[u], m)
    setCols(d.cols)
    setRows(d.rows)
  }
  function fromCounts(c: number, r: number, m: number, u: Unit) {
    const p = physicalFromGrid({ cols: c, rows: r }, m)
    setWidth(+(p.width / UNIT_INCHES[u]).toFixed(2))
    setHeight(+(p.height / UNIT_INCHES[u]).toFixed(2))
  }

  const count = cols * rows
  const overCap = count > MAX_CELLS
  const invalid = overCap || cols <= 0 || rows <= 0

  function apply() {
    const { project, setDims } = useStore.getState()
    if (project.overlay.some(v => v !== 0)
      && !window.confirm('Resizing clears your manual edits. Continue?')) return
    setDims({ cols, rows }, mesh)
  }

  return (
    <div className="flex flex-col gap-2 border-b p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fence setup</h3>
      <Label className={fieldLabel}>
        Width ({unit})
        <Input type="number" min={0} step={0.5} value={width} className="h-8 text-sm"
          onChange={e => { const v = +e.target.value; setWidth(v); fromPhysical(v, height, mesh, unit) }} />
      </Label>
      <Label className={fieldLabel}>
        Height ({unit})
        <Input type="number" min={0} step={0.5} value={height} className="h-8 text-sm"
          onChange={e => { const v = +e.target.value; setHeight(v); fromPhysical(width, v, mesh, unit) }} />
      </Label>
      <Label className={fieldLabel}>
        Unit
        <select className={selectClass} value={unit} onChange={e => setUnit(e.target.value as Unit)}>
          <option value="ft">feet</option>
          <option value="m">meters</option>
        </select>
      </Label>
      <Label className={fieldLabel}>
        Mesh size (in)
        <select className={selectClass} value={MESH_PRESETS.includes(mesh) ? String(mesh) : 'custom'}
          onChange={e => {
            if (e.target.value === 'custom') return
            const m = +e.target.value
            setMesh(m)
            fromPhysical(width, height, m, unit)
          }}>
          {MESH_PRESETS.map(m => <option key={m} value={m}>{m}″</option>)}
          <option value="custom">custom…</option>
        </select>
        <Input type="number" min={0.5} step={0.125} value={mesh} className="h-8 text-sm"
          onChange={e => { const m = +e.target.value; setMesh(m); fromPhysical(width, height, m, unit) }} />
      </Label>
      <Label className={fieldLabel}>
        Columns
        <Input type="number" min={1} value={cols} className="h-8 text-sm"
          onChange={e => { const v = Math.floor(+e.target.value); setCols(v); fromCounts(v, rows, mesh, unit) }} />
      </Label>
      <Label className={fieldLabel}>
        Rows
        <Input type="number" min={1} value={rows} className="h-8 text-sm"
          onChange={e => { const v = Math.floor(+e.target.value); setRows(v); fromCounts(cols, v, mesh, unit) }} />
      </Label>
      {overCap && <p className="text-destructive text-sm">That's {count.toLocaleString()} diamonds — the max is 50,000.</p>}
      <Button variant="default" size="sm" onClick={apply} disabled={invalid}>
        Apply ({cols}×{rows} = {count.toLocaleString()} diamonds)
      </Button>
    </div>
  )
}
