import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders all panels and the empty state', async () => {
  render(<App />)
  expect(await screen.findByText(/fence setup/i)).toBeInTheDocument()
  expect(screen.getByText(/^image$/i)).toBeInTheDocument()
  expect(screen.getByText(/palette/i)).toBeInTheDocument()
  expect(screen.getByText(/pixelation/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /shopping list/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /print chart/i })).toBeInTheDocument()
  expect(await screen.findByText(/try a sample image/i)).toBeInTheDocument()
})
