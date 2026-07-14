import { Moon, Sun } from 'lucide-react'
import { useStore, type Tool } from '../store'
import { useTheme } from '../theme'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const { setTheme } = useTheme()

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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Toggle theme">
              <Sun className="scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
