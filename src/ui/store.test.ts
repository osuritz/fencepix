import { beforeEach, expect, test } from 'vitest'
import { UNDO_CAP, useStore } from './store'
import { OVERLAY_EMPTY, UNTOUCHED, cellIndex, composite } from '../core/grid'
import { defaultProject } from '../core/project'

// A tiny fake ImageData (jsdom lacks canvas): 4×4 opaque red.
function fakeImageData(): ImageData {
  const data = new Uint8ClampedArray(4 * 4 * 4)
  for (let i = 0; i < 16; i++) data.set([255, 0, 0, 255], i * 4)
  return { data, width: 4, height: 4, colorSpace: 'srgb' } as ImageData
}

beforeEach(() => {
  useStore.getState().loadProject(defaultProject(), null)
})

test('painting writes overlay and shows through composite', () => {
  const s = useStore.getState()
  s.selectColor(3)
  s.setTool('paint')
  s.beginStroke()
  s.applyTool(0, 0)
  const { project } = useStore.getState()
  const i = cellIndex(0, 0, project.dims)
  expect(project.overlay[i]).toBe(3)
  expect(composite(project.base, project.overlay)[i]).toBe(3)
})

test('eraser marks explicit empty', () => {
  const s = useStore.getState()
  s.setTool('erase')
  s.beginStroke()
  s.applyTool(1, 1)
  const { project } = useStore.getState()
  expect(project.overlay[cellIndex(1, 1, project.dims)]).toBe(OVERLAY_EMPTY)
})

test('undo/redo restore overlay snapshots', () => {
  const s = useStore.getState()
  s.selectColor(2); s.setTool('paint')
  s.beginStroke(); s.applyTool(0, 0)
  s.beginStroke(); s.applyTool(0, 1)
  const d = useStore.getState().project.dims
  s.undo()
  expect(useStore.getState().project.overlay[cellIndex(0, 1, d)]).toBe(UNTOUCHED)
  expect(useStore.getState().project.overlay[cellIndex(0, 0, d)]).toBe(2)
  s.redo()
  expect(useStore.getState().project.overlay[cellIndex(0, 1, d)]).toBe(2)
})

test('undo stack is capped', () => {
  const s = useStore.getState()
  s.selectColor(1); s.setTool('paint')
  for (let i = 0; i < UNDO_CAP + 20; i++) { s.beginStroke(); s.applyTool(0, 0) }
  expect(useStore.getState().undoStack.length).toBeLessThanOrEqual(UNDO_CAP)
})

test('setDims clears overlay and undo history', () => {
  const s = useStore.getState()
  s.selectColor(1); s.setTool('paint'); s.beginStroke(); s.applyTool(0, 0)
  s.setDims({ cols: 10, rows: 8 }, 2)
  const st = useStore.getState()
  expect(st.project.dims).toEqual({ cols: 10, rows: 8 })
  expect(Array.from(st.project.overlay)).toEqual(Array(80).fill(0))
  expect(st.undoStack).toHaveLength(0)
})

test('setImage quantizes the base grid; settings change preserves overlay', () => {
  const s = useStore.getState()
  s.setDims({ cols: 4, rows: 4 }, 2)
  s.setImage({ dataUrl: 'data:x', width: 4, height: 4 }, fakeImageData())
  const base = useStore.getState().project.base
  expect(Array.from(base).some(v => v !== 0)).toBe(true) // red cells got a color
  s.setTool('paint'); s.selectColor(5); s.beginStroke(); s.applyTool(0, 0)
  s.setSettings({ dither: false })
  const st = useStore.getState()
  expect(st.project.overlay[0]).toBe(5) // overlay survived
})

test('paletteRemove remaps or clears overlay uses and re-quantizes', () => {
  const s = useStore.getState()
  s.setTool('paint'); s.selectColor(4); s.beginStroke(); s.applyTool(2, 2)
  const d = useStore.getState().project.dims
  s.paletteRemove(4, 9)
  expect(useStore.getState().project.overlay[cellIndex(2, 2, d)]).toBe(9)
  expect(useStore.getState().project.palette.colors.find(c => c.id === 4)).toBeUndefined()
  s.beginStroke(); s.applyTool(3, 3)
  s.paletteRemove(9, null)
  expect(useStore.getState().project.overlay[cellIndex(2, 2, d)]).toBe(OVERLAY_EMPTY)
})

test('eyedropper selects the composited color and never begins a stroke', () => {
  const s = useStore.getState()
  s.setTool('paint'); s.selectColor(6); s.beginStroke(); s.applyTool(1, 2)
  s.setTool('eyedropper')
  s.applyTool(1, 2)
  expect(useStore.getState().selectedColorId).toBe(6)
})
