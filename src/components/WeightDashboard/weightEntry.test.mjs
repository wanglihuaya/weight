import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyWeightEntryDragDelta,
  buildWeightEntryCanvasLayout,
  buildWeightEntryReadoutMotion,
  buildWeightEntryModes,
  clampWeightEntryValue,
  getWeightEntryBoundState,
  projectWeightEntryTarget,
  quantizeWeightEntryValue,
  resolveWeightEntryPayloadValue,
  stepWeightEntrySpring,
} from './weightEntry.ts'

test('buildWeightEntryModes starts with the now mode and record action', () => {
  const modes = buildWeightEntryModes()

  assert.equal(modes[0].key, 'now')
  assert.equal(modes[0].label, '现在')
  assert.equal(modes[0].actionText, '记录体重')
})

test('quantizeWeightEntryValue snaps to the configured step and clamps to bounds', () => {
  assert.equal(quantizeWeightEntryValue(71.14, 0.1, 30, 150), 71.1)
  assert.equal(quantizeWeightEntryValue(71.16, 0.1, 30, 150), 71.2)
  assert.equal(quantizeWeightEntryValue(29.92, 0.1, 30, 150), 30)
  assert.equal(quantizeWeightEntryValue(150.28, 0.1, 30, 150), 150)
})

test('clampWeightEntryValue keeps the dragged value inside the allowed range', () => {
  assert.equal(clampWeightEntryValue(28.4, 30, 150), 30)
  assert.equal(clampWeightEntryValue(88.6, 30, 150), 88.6)
  assert.equal(clampWeightEntryValue(151.2, 30, 150), 150)
})

test('applyWeightEntryDragDelta adds resistance and gets heavier near bounds', () => {
  assert.equal(applyWeightEntryDragDelta(20, 71, 30, 150), 15.6)
  assert.equal(applyWeightEntryDragDelta(20, 30, 30, 150), 9)
  assert.equal(applyWeightEntryDragDelta(-20, 150, 30, 150), -9)
})

test('projectWeightEntryTarget keeps release momentum in the same direction before snapping', () => {
  assert.equal(projectWeightEntryTarget(71.02, 0.42, 0.1, 30, 150), 71.2)
  assert.equal(projectWeightEntryTarget(71.02, -0.42, 0.1, 30, 150), 70.8)
})

test('stepWeightEntrySpring converges smoothly toward the snapped value', () => {
  let state = { current: 70, velocity: 0 }

  for (let index = 0; index < 18; index += 1) {
    state = stepWeightEntrySpring(state, 71.2)
  }

  assert.ok(Math.abs(state.current - 71.2) < 0.04)
  assert.ok(Math.abs(state.velocity) < 0.04)
})

test('buildWeightEntryReadoutMotion adds lift and scale while dragging off center', () => {
  const resting = buildWeightEntryReadoutMotion(0)
  const engaged = buildWeightEntryReadoutMotion(0.48)

  assert.equal(resting.translateY, 0)
  assert.ok(engaged.translateY < 0)
  assert.ok(engaged.scale > resting.scale)
  assert.ok(engaged.shadow > resting.shadow)
})

test('getWeightEntryBoundState marks the active edge when the ruler reaches min or max', () => {
  assert.deepEqual(getWeightEntryBoundState(30.02, 30, 150), {
    atMin: true,
    atMax: false,
  })
  assert.deepEqual(getWeightEntryBoundState(149.98, 30, 150), {
    atMin: false,
    atMax: true,
  })
  assert.deepEqual(getWeightEntryBoundState(71.1, 30, 150), {
    atMin: false,
    atMax: false,
  })
})

test('resolveWeightEntryPayloadValue reads the current value from ruler motion events', () => {
  assert.equal(resolveWeightEntryPayloadValue(71.23), 71.23)
  assert.equal(resolveWeightEntryPayloadValue({ detail: 71.4 }), 71.4)
  assert.equal(resolveWeightEntryPayloadValue({ detail: { current: 72.4 } }), 72.4)
  assert.equal(resolveWeightEntryPayloadValue({ detail: { value: 69.8 } }), 69.8)
  assert.equal(resolveWeightEntryPayloadValue({ detail: { current: '72.4' } }), undefined)
})

test('buildWeightEntryCanvasLayout keeps tick labels inside the visible canvas height', () => {
  const layout = buildWeightEntryCanvasLayout(112)

  assert.ok(layout.labelTop < 112)
  assert.ok(layout.pointerHeight < 112)
  assert.ok(layout.majorTickHeight < layout.labelTop)
  assert.ok(layout.labelTop > layout.majorTickHeight)
})
