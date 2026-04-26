import test from 'node:test'
import assert from 'node:assert/strict'

import { createTabSwitchContext, runTabSwitchAnimation } from './tabSwitch.ts'

test('runTabSwitchAnimation restores indicator scale after offset animation finishes', () => {
  const calls = []
  const context = createTabSwitchContext({
    scaleTo(value) {
      calls.push({ type: 'scale', value })
    },
    moveTo(value) {
      calls.push({ type: 'offset', value })
    },
    scheduleReset(onReset) {
      calls.push({ type: 'schedule' })
      onReset()
    },
  })

  runTabSwitchAnimation(context, 2)

  assert.deepEqual(calls, [
    { type: 'scale', value: 1.5 },
    { type: 'offset', value: 200 },
    { type: 'schedule' },
    { type: 'scale', value: 1 },
  ])
})

test('createTabSwitchContext ignores missing animation handlers', () => {
  const context = createTabSwitchContext({})

  assert.doesNotThrow(() => {
    runTabSwitchAnimation(context, 1)
  })
})
