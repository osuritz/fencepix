import { describe, expect, test } from 'vitest'
import { MAX_WORKING_SIDE, isKnownUnsupported, workingSize } from './imageLoad'

describe('workingSize', () => {
  test('small images pass through', () => {
    expect(workingSize(800, 600)).toEqual({ width: 800, height: 600 })
  })
  test('large images scale down to max side 2048 preserving aspect', () => {
    expect(MAX_WORKING_SIDE).toBe(2048)
    expect(workingSize(4096, 2048)).toEqual({ width: 2048, height: 1024 })
    expect(workingSize(3000, 6000)).toEqual({ width: 1024, height: 2048 })
  })
  test('never returns zero', () => {
    expect(workingSize(10_000, 1).height).toBe(1)
  })
})

describe('isKnownUnsupported', () => {
  test('flags HEIC/HEIF by mime or extension', () => {
    expect(isKnownUnsupported(new File([''], 'a.heic', { type: 'image/heic' }))).toBe('HEIC')
    expect(isKnownUnsupported(new File([''], 'photo.HEIF', { type: '' }))).toBe('HEIC')
  })
  test('passes normal images', () => {
    expect(isKnownUnsupported(new File([''], 'a.png', { type: 'image/png' }))).toBeNull()
  })
})
