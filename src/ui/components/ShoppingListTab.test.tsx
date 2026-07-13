import { beforeEach, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShoppingListTab } from './ShoppingListTab'
import { useStore } from '../store'
import { defaultProject } from '../../core/project'

beforeEach(() => {
  useStore.getState().loadProject(defaultProject(), null)
})

test('lists painted colors with counts and overage', async () => {
  const s = useStore.getState()
  s.setTool('paint'); s.selectColor(4) // Red
  s.beginStroke()
  for (let col = 0; col < 21; col++) s.applyTool(0, col)
  render(<ShoppingListTab />)
  expect(screen.getByText('Red')).toBeInTheDocument()
  expect(screen.getByText('21')).toBeInTheDocument()
  // ceil(21 · 1.05) = 23, shown in both the Buy column and the Total row
  expect(screen.getAllByText('23').length).toBeGreaterThanOrEqual(1)
})

test('changing overage updates the buy column', async () => {
  const s = useStore.getState()
  s.setTool('paint'); s.selectColor(4)
  s.beginStroke()
  for (let col = 0; col < 10; col++) s.applyTool(0, col)
  render(<ShoppingListTab />)
  const overage = screen.getByLabelText(/overage/i)
  await userEvent.clear(overage)
  await userEvent.type(overage, '20')
  // ceil(10 · 1.2) = 12, shown in both the Buy column and the Total row
  expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1)
})

test('empty design shows a hint instead of a table', () => {
  render(<ShoppingListTab />)
  expect(screen.getByText(/nothing to buy yet/i)).toBeInTheDocument()
})
