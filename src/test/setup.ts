import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest.config has test.globals disabled, so RTL's auto-cleanup (which
// only registers when it finds a global `afterEach`) never runs; without
// this, DOM nodes from earlier renders in the same file leak into later
// tests and break queries like getByLabelText once a file renders >1 time.
afterEach(() => {
  cleanup()
})
