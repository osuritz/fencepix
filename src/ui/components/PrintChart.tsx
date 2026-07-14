import { useStore } from '../store'
import { paginate } from '../../core/chart'
import { cellCenter } from '../../core/lattice'
import { EMPTY, composite } from '../../core/grid'
import { luminance } from '../../core/color'
import { Button } from '@/components/ui/button'

export function PrintChart({ onClose }: { onClose: () => void }) {
  const project = useStore(s => s.project)
  useStore(s => s.revision)
  const cells = composite(project.base, project.overlay)
  const pages = paginate(project.dims)
  const symbolById = new Map(project.palette.colors.map((c, i) => [c.id, i + 1]))
  const colorById = new Map(project.palette.colors.map(c => [c.id, c]))

  return (
    <div className="print-chart fixed inset-0 z-10 overflow-auto bg-white p-4 text-neutral-900">
      <div className="chart-actions no-print mb-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
      <h2 className="text-lg font-semibold my-2">Installation chart — {project.dims.cols}×{project.dims.rows} diamonds</h2>
      <ol className="chart-legend">
        {project.palette.colors.map((c, i) => (
          <li key={c.id}>
            <span className="inline-block size-4 rounded border border-neutral-300" style={{ background: c.hex }} /> {i + 1} — {c.name} ({c.hex})
          </li>
        ))}
      </ol>
      <p className="my-2">Rows count top→bottom, columns left→right. Odd rows sit half a diamond to the right.</p>
      {pages.map(page => {
        const minX = page.colStart * 2
        const maxX = page.colEnd * 2 + 1
        const minY = page.rowStart
        const maxY = page.rowEnd + 1
        return (
          <div className="chart-page" key={`${page.pageRow}-${page.pageCol}`}>
            <h3 className="mt-3 mb-1 font-medium">
              Page {page.pageRow + 1}-{page.pageCol + 1} — rows {page.rowStart + 1}–{page.rowEnd},
              columns {page.colStart + 1}–{page.colEnd}
            </h3>
            <svg viewBox={`${minX - 2} ${minY - 1.5} ${maxX - minX + 3} ${maxY - minY + 2.5}`}>
              {Array.from({ length: page.rowEnd - page.rowStart }, (_, i) => {
                const row = page.rowStart + i
                return (
                  <text key={`r${row}`} x={minX - 1.2} y={cellCenter(row, 0).y}
                    fontSize={0.6} textAnchor="middle" dominantBaseline="central">
                    {row + 1}
                  </text>
                )
              })}
              {Array.from({ length: page.colEnd - page.colStart }, (_, i) => {
                const col = page.colStart + i
                if ((col + 1) % 5 !== 0 && col !== page.colStart) return null
                return (
                  <text key={`c${col}`} x={col * 2 + 1} y={minY - 0.7}
                    fontSize={0.6} textAnchor="middle">
                    {col + 1}
                  </text>
                )
              })}
              {Array.from({ length: page.rowEnd - page.rowStart }, (_, ri) =>
                Array.from({ length: page.colEnd - page.colStart }, (_, ci) => {
                  const row = page.rowStart + ri
                  const col = page.colStart + ci
                  const c = cellCenter(row, col)
                  const id = cells[row * project.dims.cols + col]
                  const color = id === EMPTY ? null : colorById.get(id)
                  const points = `${c.x},${c.y - 1} ${c.x + 1},${c.y} ${c.x},${c.y + 1} ${c.x - 1},${c.y}`
                  return (
                    <g key={`${row}-${col}`}>
                      <polygon points={points} fill={color?.hex ?? 'none'}
                        stroke="#999" strokeWidth={0.04} />
                      {color && (
                        <text x={c.x} y={c.y} fontSize={0.7} textAnchor="middle"
                          dominantBaseline="central"
                          fill={luminance(color.hex) > 0.45 ? '#000' : '#fff'}>
                          {symbolById.get(id)}
                        </text>
                      )}
                    </g>
                  )
                }))}
            </svg>
          </div>
        )
      })}
    </div>
  )
}
