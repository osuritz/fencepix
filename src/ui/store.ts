import { create } from 'zustand'
import { designSize, type GridDims } from '../core/lattice'
import {
  OVERLAY_EMPTY, UNTOUCHED, cellIndex, composite, createCells,
} from '../core/grid'
import {
  CLASSIC_12, addColor, createPalette, remapCells, removeColor, updateColor,
} from '../core/palette'
import { sampleImage, type ImageTransform } from '../core/sample'
import { quantize } from '../core/quantize'
import {
  defaultProject, type Project, type ProjectImage, type ProjectSettings,
} from '../core/project'

export type Tool = 'paint' | 'erase' | 'eyedropper'
export const UNDO_CAP = 100

export interface AppStore {
  project: Project
  imageData: ImageData | null
  samples: Float32Array | null
  tool: Tool
  selectedColorId: number
  undoStack: Uint16Array[]
  redoStack: Uint16Array[]
  autosaveError: boolean
  revision: number

  setTool(t: Tool): void
  selectColor(id: number): void
  setDims(dims: GridDims, meshInches: number): void
  setImage(image: ProjectImage, data: ImageData): void
  setTransform(t: ImageTransform): void
  fitImage(): void
  setSettings(patch: Partial<ProjectSettings>): void
  paletteAdd(name: string, hex: string): void
  paletteUpdate(id: number, patch: { name?: string; hex?: string }): void
  paletteRemove(id: number, remapTo: number | null): void
  paletteLoadPreset(): void
  beginStroke(): void
  applyTool(row: number, col: number): void
  undo(): void
  redo(): void
  loadProject(p: Project, data: ImageData | null): void
  setAutosaveError(v: boolean): void
}

function resampled(project: Project, imageData: ImageData | null): { samples: Float32Array | null; base: Uint16Array } {
  if (!imageData) return { samples: null, base: createCells(project.dims) }
  const samples = sampleImage(
    { data: imageData.data, width: imageData.width, height: imageData.height },
    project.transform, project.dims,
  )
  return { samples, base: quantize(samples, project.dims, project.palette, project.settings) }
}

function requantized(project: Project, samples: Float32Array | null): Uint16Array {
  if (!samples) return createCells(project.dims)
  return quantize(samples, project.dims, project.palette, project.settings)
}

function coverFit(project: Project): ImageTransform {
  if (!project.image) return project.transform
  const ds = designSize(project.dims)
  const scale = Math.max(ds.width / project.image.width, ds.height / project.image.height)
  return {
    scale,
    x: (ds.width - project.image.width * scale) / 2,
    y: (ds.height - project.image.height * scale) / 2,
  }
}

export const useStore = create<AppStore>((set, get) => ({
  project: defaultProject(),
  imageData: null,
  samples: null,
  tool: 'paint',
  selectedColorId: 0,
  undoStack: [],
  redoStack: [],
  autosaveError: false,
  revision: 0,

  setTool: tool => set({ tool }),
  selectColor: id => set({ selectedColorId: id }),

  setDims(dims, meshInches) {
    const { project, imageData } = get()
    const next: Project = {
      ...project, dims, meshInches,
      base: createCells(dims), overlay: createCells(dims),
    }
    const fitted = { ...next, transform: next.image ? coverFit(next) : next.transform }
    const { samples, base } = resampled(fitted, imageData)
    set(s => ({
      project: { ...fitted, base }, samples,
      undoStack: [], redoStack: [], revision: s.revision + 1,
    }))
  },

  setImage(image, data) {
    const { project } = get()
    const withImage: Project = { ...project, image }
    const fitted: Project = { ...withImage, transform: coverFit(withImage) }
    const { samples, base } = resampled(fitted, data)
    set(s => ({
      project: { ...fitted, base }, imageData: data, samples,
      revision: s.revision + 1,
    }))
  },

  setTransform(transform) {
    const { project, imageData } = get()
    const next: Project = { ...project, transform }
    const { samples, base } = resampled(next, imageData)
    set(s => ({ project: { ...next, base }, samples, revision: s.revision + 1 }))
  },

  fitImage() {
    const t = coverFit(get().project)
    get().setTransform(t)
  },

  setSettings(patch) {
    const { project, samples } = get()
    const next: Project = { ...project, settings: { ...project.settings, ...patch } }
    set(s => ({
      project: { ...next, base: requantized(next, samples) },
      revision: s.revision + 1,
    }))
  },

  paletteAdd(name, hex) {
    const { project, samples } = get()
    const next: Project = { ...project, palette: addColor(project.palette, name, hex) }
    set(s => ({ project: { ...next, base: requantized(next, samples) }, revision: s.revision + 1 }))
  },

  paletteUpdate(id, patch) {
    const { project, samples } = get()
    const next: Project = { ...project, palette: updateColor(project.palette, id, patch) }
    set(s => ({ project: { ...next, base: requantized(next, samples) }, revision: s.revision + 1 }))
  },

  paletteRemove(id, remapTo) {
    const { project, samples, selectedColorId } = get()
    const overlay = remapCells(project.overlay, id, remapTo ?? OVERLAY_EMPTY)
    const next: Project = { ...project, overlay, palette: removeColor(project.palette, id) }
    set(s => ({
      project: { ...next, base: requantized(next, samples) },
      selectedColorId: selectedColorId === id ? (remapTo ?? 0) : selectedColorId,
      undoStack: [], redoStack: [],
      revision: s.revision + 1,
    }))
  },

  paletteLoadPreset() {
    const { project, samples } = get()
    // Resetting nextId via createPalette(CLASSIC_12) is only safe because we
    // also clear the undo/redo stacks below: without that, undoing past this
    // point could restore an overlay referencing ids that collide with (or
    // no longer exist in) the freshly reset palette.
    const palette = createPalette(CLASSIC_12)
    const valid = new Set(palette.colors.map(c => c.id))
    const overlay = project.overlay.slice()
    for (let i = 0; i < overlay.length; i++) {
      const v = overlay[i]
      if (v !== UNTOUCHED && v !== OVERLAY_EMPTY && !valid.has(v)) overlay[i] = UNTOUCHED
    }
    const next: Project = { ...project, palette, overlay }
    set(s => ({
      project: { ...next, base: requantized(next, samples) },
      selectedColorId: 0,
      undoStack: [], redoStack: [],
      revision: s.revision + 1,
    }))
  },

  beginStroke() {
    set(s => ({
      undoStack: [...s.undoStack.slice(-(UNDO_CAP - 1)), s.project.overlay.slice()],
      redoStack: [],
    }))
  },

  applyTool(row, col) {
    const { project, tool, selectedColorId } = get()
    const i = cellIndex(row, col, project.dims)
    if (tool === 'eyedropper') {
      const v = composite(project.base, project.overlay)[i]
      if (v !== 0) set({ selectedColorId: v, tool: 'paint' })
      return
    }
    if (tool === 'paint' && selectedColorId === 0) return
    // Mutate in place for cheap drag strokes; revision drives redraws.
    project.overlay[i] = tool === 'paint' ? selectedColorId : OVERLAY_EMPTY
    set(s => ({ revision: s.revision + 1 }))
  },

  undo() {
    const { undoStack, project } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    set(s => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, project.overlay.slice()],
      project: { ...project, overlay: prev },
      revision: s.revision + 1,
    }))
  },

  redo() {
    const { redoStack, project } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    set(s => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, project.overlay.slice()],
      project: { ...project, overlay: next },
      revision: s.revision + 1,
    }))
  },

  loadProject(p, data) {
    const { samples, base } = resampled(p, data)
    set(s => ({
      project: { ...p, base }, imageData: data, samples,
      undoStack: [], redoStack: [], selectedColorId: 0,
      revision: s.revision + 1,
    }))
  },

  setAutosaveError: autosaveError => set({ autosaveError }),
}))
