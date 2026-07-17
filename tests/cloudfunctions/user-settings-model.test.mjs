import assert from 'node:assert/strict'
import test from 'node:test'

import userSettingsModel from '../../cloudfunctions/user-settings/model.js'

test('normalizePatch accepts supported partial settings', () => {
  assert.deepEqual(
    userSettingsModel.normalizePatch({
      targetWeight: 65.34,
      unit: 'lb',
      weightReminderEnabled: true,
    }),
    {
      targetWeight: 65.3,
      unit: 'lb',
      weightReminderEnabled: true,
    },
  )
})

test('normalizePatch rejects unknown-only and invalid settings', () => {
  assert.throws(
    () => userSettingsModel.normalizePatch({ unknown: true }),
    /EMPTY_SETTINGS_PATCH/,
  )
  assert.throws(
    () => userSettingsModel.normalizePatch({ heightCm: 20 }),
    /INVALID_HEIGHTCM/,
  )
  assert.throws(
    () => userSettingsModel.normalizePatch({ unit: 'stone' }),
    /INVALID_UNIT/,
  )
})

test('toSettings never exposes database metadata', () => {
  const settings = userSettingsModel.toSettings({
    _id: 'private-id',
    openid: 'private-openid',
    targetWeight: 64,
  })

  assert.equal(settings.targetWeight, 64)
  assert.equal('_id' in settings, false)
  assert.equal('openid' in settings, false)
})
