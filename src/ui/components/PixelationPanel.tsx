import { useStore } from '../store'
import { Label } from '@/components/ui/label'

export function PixelationPanel() {
  const settings = useStore(s => s.project.settings)
  return (
    <div className="flex flex-col gap-2 border-b p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pixelation</h3>
      <Label className="flex items-center gap-2 text-xs font-normal text-foreground">
        <input
          type="checkbox" checked={settings.dither}
          className="size-4 accent-primary"
          onChange={e => useStore.getState().setSettings({ dither: e.target.checked })}
        />
        Dithering
      </Label>
      <Label className="flex flex-col items-start gap-1 text-xs font-normal text-foreground">
        Transparency threshold ({settings.alphaThreshold.toFixed(2)})
        <input
          type="range" min={0} max={1} step={0.05} value={settings.alphaThreshold}
          className="w-full accent-primary"
          onChange={e => useStore.getState().setSettings({ alphaThreshold: +e.target.value })}
        />
      </Label>
    </div>
  )
}
