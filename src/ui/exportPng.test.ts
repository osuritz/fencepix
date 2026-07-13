import { expect, test } from 'vitest'
import { EXPORT_PX_PER_UNIT, MAX_EXPORT_SIDE, exportScale } from './exportPng'
import { designSize } from '../core/lattice'

test('small designs export at full resolution', () => {
  expect(exportScale({ cols: 41, rows: 32 })).toBe(EXPORT_PX_PER_UNIT)
})

test('huge designs shrink so the long side fits 8192px', () => {
  const dims = { cols: 700, rows: 70 } // 49k cells, ~1401 units wide
  const scale = exportScale(dims)
  expect(scale).toBeLessThan(EXPORT_PX_PER_UNIT)
  expect(designSize(dims).width * scale).toBeLessThanOrEqual(MAX_EXPORT_SIDE + 1)
})
