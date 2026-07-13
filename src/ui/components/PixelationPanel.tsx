import { useStore } from '../store'

export function PixelationPanel() {
  const settings = useStore(s => s.project.settings)
  return (
    <div className="panel">
      <h3>Pixelation</h3>
      <label>
        <input
          type="checkbox" checked={settings.dither}
          onChange={e => useStore.getState().setSettings({ dither: e.target.checked })}
        />
        Dithering
      </label>
      <label>Transparency threshold ({settings.alphaThreshold.toFixed(2)})
        <input
          type="range" min={0} max={1} step={0.05} value={settings.alphaThreshold}
          onChange={e => useStore.getState().setSettings({ alphaThreshold: +e.target.value })}
        />
      </label>
    </div>
  )
}
