import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { clearAutosave, loadAutosave, saveAutosave } from './persist'

test('load with nothing saved returns null', async () => {
  await clearAutosave()
  expect(await loadAutosave()).toBeNull()
})

test('save/load round-trips and overwrites', async () => {
  await saveAutosave('{"v":1}')
  expect(await loadAutosave()).toBe('{"v":1}')
  await saveAutosave('{"v":2}')
  expect(await loadAutosave()).toBe('{"v":2}')
})

test('clear removes the autosave', async () => {
  await saveAutosave('x')
  await clearAutosave()
  expect(await loadAutosave()).toBeNull()
})
