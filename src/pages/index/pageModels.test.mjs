import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildMonthlyDataView,
  buildSettingsSections,
  buildSettingsSnapshot,
} from './pageModels.ts'

test('buildSettingsSections exposes the key values shown in settings', () => {
  const snapshot = buildSettingsSnapshot(new Date('2026-04-26T12:00:00'))
  const sections = buildSettingsSections(snapshot)
  const personalSection = sections.find((section) => section.title === '个人数据')
  const displaySection = sections.find((section) => section.title === '显示设置')

  assert.equal(snapshot.membershipTitle, 'MyWeight² 会员')
  assert.equal(snapshot.membershipBadge, '高级版')
  assert.equal(personalSection?.items[0]?.value, '67.0千克')
  assert.equal(personalSection?.items[1]?.value, '66.5千克')
  assert.equal(displaySection?.items[0]?.value, '千克')
  assert.equal(displaySection?.items[2]?.value, '周一')
})

test('buildMonthlyDataView builds the April 2026 calendar shown in the design', () => {
  const view = buildMonthlyDataView(new Date('2026-04-01T00:00:00'), new Date('2026-04-26T12:00:00'))

  assert.equal(view.monthLabel, '2026年4月')
  assert.deepEqual(view.weekdayLabels, ['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
  assert.equal(view.days[0].label, '')
  assert.equal(view.days[1].label, '')
  assert.equal(view.days[2].label, '1')
  assert.equal(view.days[2].isRecorded, true)
  assert.equal(view.days[27].label, '26')
  assert.equal(view.days[27].isToday, true)
  assert.equal(view.days[28].label, '27')
  assert.equal(view.days[28].isRecorded, false)
  assert.equal(view.monthAverageLabel, '67.0')
  assert.equal(view.weightChangeLabel, '0.0')
  assert.deepEqual(view.weekGroups.map((group) => group.label), [
    '4月1日至5日',
    '4月6日至12日',
    '4月13日至19日',
    '4月20日至26日',
    '4月27日至30日',
  ])
})
