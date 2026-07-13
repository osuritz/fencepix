import { useStore } from '../store'
import { composite } from '../../core/grid'
import { shoppingList } from '../../core/shopping'

export function ShoppingListTab() {
  const project = useStore(s => s.project)
  useStore(s => s.revision) // recount after paint strokes
  const lines = shoppingList(composite(project.base, project.overlay), project.settings.overagePct)
  const byId = new Map(project.palette.colors.map(c => [c.id, c]))
  const total = lines.reduce((sum, l) => sum + l.withOverage, 0)

  function copy() {
    const text = lines
      .map(l => `${byId.get(l.colorId)?.name ?? `color ${l.colorId}`} (${byId.get(l.colorId)?.hex ?? '?'}): ${l.withOverage}`)
      .join('\n')
    void navigator.clipboard.writeText(`${text}\nTotal: ${total}`)
  }

  if (lines.length === 0) return <p className="panel">Nothing to buy yet — load an image or paint some diamonds.</p>

  return (
    <div className="panel">
      <label>Overage %
        <input
          type="number" min={0} max={100} value={project.settings.overagePct}
          onChange={e => useStore.getState().setSettings({ overagePct: Math.max(0, +e.target.value) })}
        />
      </label>
      <table>
        <thead><tr><th /><th>Color</th><th>Used</th><th>Buy</th></tr></thead>
        <tbody>
          {lines.map(l => {
            const c = byId.get(l.colorId)
            return (
              <tr key={l.colorId}>
                <td><span className="swatch" style={{ background: c?.hex }} /></td>
                <td>{c?.name ?? `color ${l.colorId}`}</td>
                <td>{l.count}</td>
                <td>{l.withOverage}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot><tr><td /><td>Total</td><td /><td>{total}</td></tr></tfoot>
      </table>
      <button onClick={copy}>Copy as text</button>
    </div>
  )
}
