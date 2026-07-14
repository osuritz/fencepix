import { useStore } from '../store'
import { composite } from '../../core/grid'
import { shoppingList } from '../../core/shopping'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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

  if (lines.length === 0) {
    return (
      <p className="p-3 text-sm text-muted-foreground">
        Nothing to buy yet — load an image or paint some diamonds.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <Label className="flex flex-col items-start gap-1 text-xs font-normal text-foreground">
        Overage %
        <Input
          type="number" min={0} max={100} value={project.settings.overagePct}
          className="h-8 w-20 text-sm"
          onChange={e => useStore.getState().setSettings({ overagePct: Math.max(0, +e.target.value) })}
        />
      </Label>
      <table className="text-sm">
        <thead>
          <tr>
            <th />
            <th className="p-1 text-left">Color</th>
            <th className="p-1 text-left">Used</th>
            <th className="p-1 text-left">Buy</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(l => {
            const c = byId.get(l.colorId)
            return (
              <tr key={l.colorId}>
                <td className="p-1">
                  <span className="inline-block size-4 rounded border border-border" style={{ background: c?.hex }} />
                </td>
                <td className="p-1">{c?.name ?? `color ${l.colorId}`}</td>
                <td className="p-1 tabular-nums">{l.count}</td>
                <td className="p-1 tabular-nums">{l.withOverage}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="p-1 font-medium">Total</td>
            <td />
            <td className="p-1 font-medium tabular-nums">{total}</td>
          </tr>
        </tfoot>
      </table>
      <Button variant="outline" size="sm" onClick={copy}>Copy as text</Button>
    </div>
  )
}
