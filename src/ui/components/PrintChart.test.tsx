import { beforeEach, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrintChart } from './PrintChart'
import { useStore } from '../store'
import { defaultProject } from '../../core/project'

beforeEach(() => {
  useStore.getState().loadProject(defaultProject(), null)
})

test('default 41×32 grid renders a 2×2 page grid (41 cols / 25, 32 rows / 30)', () => {
  render(<PrintChart onClose={() => {}} />)
  expect(screen.getByText(/Page 1-1/)).toBeInTheDocument()
  expect(screen.getByText(/Page 1-2/)).toBeInTheDocument()
  expect(screen.getByText(/Page 2-2/)).toBeInTheDocument()
  expect(screen.queryByText(/Page 1-3/)).toBeNull()
  expect(screen.queryByText(/Page 3-1/)).toBeNull()
})

test('legend lists every palette color with its symbol number', () => {
  render(<PrintChart onClose={() => {}} />)
  const legend = screen.getByRole('list')
  expect(legend.children).toHaveLength(12)
  expect(legend.children[0].textContent).toContain('1')
  expect(legend.children[0].textContent).toContain('White')
})

test('painted cells appear as numbered diamonds', () => {
  const s = useStore.getState()
  s.setTool('paint'); s.selectColor(4); s.beginStroke(); s.applyTool(0, 0)
  render(<PrintChart onClose={() => {}} />)
  // Cell symbols are the only <text> nodes inside <g> groups; edge labels
  // are direct children of the <svg>.
  expect(document.querySelector('svg g text')?.textContent).toBe('4')
})
