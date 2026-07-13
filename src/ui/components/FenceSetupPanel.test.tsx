import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FenceSetupPanel } from './FenceSetupPanel'
import { useStore } from '../store'
import { defaultProject } from '../../core/project'

beforeEach(() => {
  useStore.getState().loadProject(defaultProject(), null)
})

test('physical dims compute diamond counts (10ft × 4ft @ 2in → 41×32)', async () => {
  render(<FenceSetupPanel />)
  await userEvent.clear(screen.getByLabelText(/width/i))
  await userEvent.type(screen.getByLabelText(/width/i), '10')
  await userEvent.clear(screen.getByLabelText(/height/i))
  await userEvent.type(screen.getByLabelText(/height/i), '4')
  expect(screen.getByLabelText(/columns/i)).toHaveValue(41)
  expect(screen.getByLabelText(/rows/i)).toHaveValue(32)
})

test('editing counts updates the physical fields', async () => {
  render(<FenceSetupPanel />)
  await userEvent.clear(screen.getByLabelText(/columns/i))
  await userEvent.type(screen.getByLabelText(/columns/i), '20')
  const width = screen.getByLabelText(/width/i) as HTMLInputElement
  expect(parseFloat(width.value)).toBeCloseTo((20 * 2 * Math.SQRT2 + Math.SQRT2) / 12, 1)
})

test('apply resizes the store grid', async () => {
  render(<FenceSetupPanel />)
  await userEvent.clear(screen.getByLabelText(/columns/i))
  await userEvent.type(screen.getByLabelText(/columns/i), '20')
  await userEvent.clear(screen.getByLabelText(/rows/i))
  await userEvent.type(screen.getByLabelText(/rows/i), '10')
  await userEvent.click(screen.getByRole('button', { name: /apply/i }))
  expect(useStore.getState().project.dims).toEqual({ cols: 20, rows: 10 })
})

test('over-cap grids disable apply and explain why', async () => {
  render(<FenceSetupPanel />)
  await userEvent.clear(screen.getByLabelText(/columns/i))
  await userEvent.type(screen.getByLabelText(/columns/i), '1000')
  await userEvent.clear(screen.getByLabelText(/rows/i))
  await userEvent.type(screen.getByLabelText(/rows/i), '1000')
  expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
  expect(screen.getByText(/50,?000/)).toBeInTheDocument()
})

test('resizing over manual edits asks for confirmation', async () => {
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const s = useStore.getState()
  s.selectColor(1); s.setTool('paint'); s.beginStroke(); s.applyTool(0, 0)
  render(<FenceSetupPanel />)
  await userEvent.clear(screen.getByLabelText(/columns/i))
  await userEvent.type(screen.getByLabelText(/columns/i), '20')
  await userEvent.click(screen.getByRole('button', { name: /apply/i }))
  expect(confirmSpy).toHaveBeenCalled()
  expect(useStore.getState().project.dims.cols).toBe(41) // declined → unchanged
  confirmSpy.mockRestore()
})
