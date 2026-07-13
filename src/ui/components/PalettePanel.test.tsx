import { beforeEach, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PalettePanel } from './PalettePanel'
import { useStore } from '../store'
import { defaultProject } from '../../core/project'
import { cellIndex } from '../../core/grid'

beforeEach(() => {
  useStore.getState().loadProject(defaultProject(), null)
})

test('renders 12 chips and selects on swatch click', async () => {
  render(<PalettePanel />)
  const swatches = screen.getAllByRole('button', { name: /select/i })
  expect(swatches).toHaveLength(12)
  await userEvent.click(swatches[3])
  expect(useStore.getState().selectedColorId).toBe(4)
})

test('add color grows the palette with a fresh id', async () => {
  render(<PalettePanel />)
  await userEvent.click(screen.getByRole('button', { name: /add color/i }))
  const { palette } = useStore.getState().project
  expect(palette.colors).toHaveLength(13)
  expect(palette.colors[12].id).toBe(13)
})

test('removing an unused color needs no dialog', async () => {
  render(<PalettePanel />)
  await userEvent.click(screen.getAllByRole('button', { name: /remove/i })[0])
  expect(useStore.getState().project.palette.colors).toHaveLength(11)
})

test('removing a used color offers remap and applies it', async () => {
  const s = useStore.getState()
  s.selectColor(1); s.setTool('paint'); s.beginStroke(); s.applyTool(0, 0)
  render(<PalettePanel />)
  await userEvent.click(screen.getAllByRole('button', { name: /remove/i })[0])
  const dialogSelect = await screen.findByLabelText(/replace with/i)
  await userEvent.selectOptions(dialogSelect, '2')
  await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
  const { project } = useStore.getState()
  expect(project.overlay[cellIndex(0, 0, project.dims)]).toBe(2)
  expect(project.palette.colors.find(c => c.id === 1)).toBeUndefined()
})
