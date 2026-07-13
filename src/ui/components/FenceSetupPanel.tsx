import { useState } from 'react'
import { MAX_CELLS, gridFromPhysical, physicalFromGrid } from '../../core/lattice'
import { useStore } from '../store'

const UNIT_INCHES = { ft: 12, m: 39.3701 } as const
type Unit = keyof typeof UNIT_INCHES
const MESH_PRESETS = [2, 2.25, 2.375]

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
    <div className="panel">
      <h3>Fence setup</h3>
      <label>Width ({unit})
        <input type="number" min={0} step={0.5} value={width}
          onChange={e => { const v = +e.target.value; setWidth(v); fromPhysical(v, height, mesh, unit) }} />
      </label>
      <label>Height ({unit})
        <input type="number" min={0} step={0.5} value={height}
          onChange={e => { const v = +e.target.value; setHeight(v); fromPhysical(width, v, mesh, unit) }} />
      </label>
      <label>Unit
        <select value={unit} onChange={e => setUnit(e.target.value as Unit)}>
          <option value="ft">feet</option>
          <option value="m">meters</option>
        </select>
      </label>
      <label>Mesh size (in)
        <select value={MESH_PRESETS.includes(mesh) ? String(mesh) : 'custom'}
          onChange={e => {
            if (e.target.value === 'custom') return
            const m = +e.target.value
            setMesh(m)
            fromPhysical(width, height, m, unit)
          }}>
          {MESH_PRESETS.map(m => <option key={m} value={m}>{m}″</option>)}
          <option value="custom">custom…</option>
        </select>
        <input type="number" min={0.5} step={0.125} value={mesh}
          onChange={e => { const m = +e.target.value; setMesh(m); fromPhysical(width, height, m, unit) }} />
      </label>
      <label>Columns
        <input type="number" min={1} value={cols}
          onChange={e => { const v = Math.floor(+e.target.value); setCols(v); fromCounts(v, rows, mesh, unit) }} />
      </label>
      <label>Rows
        <input type="number" min={1} value={rows}
          onChange={e => { const v = Math.floor(+e.target.value); setRows(v); fromCounts(cols, v, mesh, unit) }} />
      </label>
      {overCap && <p className="error">That's {count.toLocaleString()} diamonds — the max is 50,000.</p>}
      <button onClick={apply} disabled={invalid}>Apply ({cols}×{rows} = {count.toLocaleString()} diamonds)</button>
    </div>
  )
}
