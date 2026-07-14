import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { cellAt } from '../../core/lattice'
import { composite } from '../../core/grid'
import { canvasColors, drawDesign, screenToDesign, type Viewport } from '../render'

export function FenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewRef = useRef<Viewport>({ offsetX: 24, offsetY: 24, pxPerUnit: 12 })
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const strokingRef = useRef(false)
  const spaceRef = useRef(false)
  const lastCellRef = useRef<string>('')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    ctx.save()
    ctx.scale(dpr, dpr)
    const { ground, wire } = canvasColors(canvas)
    ctx.fillStyle = ground
    ctx.fillRect(0, 0, w, h)
    const { project } = useStore.getState()
    drawDesign(ctx, project.dims, composite(project.base, project.overlay),
      project.palette, viewRef.current, { width: w, height: h }, wire)
    ctx.restore()
  }, [])

  useEffect(() => {
    draw()
    const unsub = useStore.subscribe(draw)
    // Theme toggles flip the `dark` class on <html>; repaint so the canvas
    // picks up the new --canvas-ground/--canvas-wire values.
    const observer = new MutationObserver(draw)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (e.type === 'keyup') { spaceRef.current = false; return }
      if (e.target === document.body) { spaceRef.current = true; e.preventDefault() }
    }
    window.addEventListener('resize', draw)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      unsub()
      observer.disconnect()
      window.removeEventListener('resize', draw)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [draw])

  // Native non-passive listener: React registers root wheel listeners as
  // passive, so preventDefault() in an onWheel prop is ignored and the page
  // would scroll while zooming.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      const v = viewRef.current
      const before = screenToDesign(v, mx, my)
      const pxPerUnit = Math.min(100, Math.max(2, v.pxPerUnit * Math.exp(-e.deltaY * 0.0015)))
      viewRef.current = { pxPerUnit, offsetX: mx - before.x * pxPerUnit, offsetY: my - before.y * pxPerUnit }
      draw()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [draw])

  function eventCell(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const p = screenToDesign(viewRef.current, e.clientX - rect.left, e.clientY - rect.top)
    return cellAt(p.x, p.y, useStore.getState().project.dims)
  }

  return (
    <canvas
      ref={canvasRef}
      className="flex-1 w-full touch-none cursor-crosshair"
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId)
        if (spaceRef.current || e.button === 1) {
          const v = viewRef.current
          panRef.current = { x: e.clientX, y: e.clientY, ox: v.offsetX, oy: v.offsetY }
          return
        }
        if (e.button !== 0) return
        const cell = eventCell(e)
        if (!cell) return
        const s = useStore.getState()
        if (s.tool === 'eyedropper') {
          s.applyTool(cell.row, cell.col)
          return
        }
        s.beginStroke()
        strokingRef.current = true
        lastCellRef.current = `${cell.row},${cell.col}`
        s.applyTool(cell.row, cell.col)
      }}
      onPointerMove={e => {
        if (panRef.current) {
          const p = panRef.current
          viewRef.current = {
            ...viewRef.current,
            offsetX: p.ox + e.clientX - p.x,
            offsetY: p.oy + e.clientY - p.y,
          }
          draw()
          return
        }
        if (!strokingRef.current) return
        const cell = eventCell(e)
        if (!cell) return
        const key = `${cell.row},${cell.col}`
        if (key === lastCellRef.current) return
        lastCellRef.current = key
        useStore.getState().applyTool(cell.row, cell.col)
      }}
      onPointerUp={() => {
        panRef.current = null
        strokingRef.current = false
        lastCellRef.current = ''
      }}
    />
  )
}
