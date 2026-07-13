import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePanel } from './ImagePanel'

test('HEIC file shows a format-specific error', async () => {
  render(<ImagePanel />)
  const input = screen.getByLabelText(/choose image/i)
  await userEvent.upload(input, new File([''], 'pic.heic', { type: 'image/heic' }))
  expect(await screen.findByText(/HEIC/)).toBeInTheDocument()
})
