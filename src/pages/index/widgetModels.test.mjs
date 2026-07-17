import test from 'node:test'
import assert from 'node:assert/strict'

import { buildWidgetPanelView } from './widgetModels.ts'

const settings = {
  baselineWeight: 67,
  targetWeight: 66.5,
  heightCm: 172,
  unit: 'kg',
  indicator: 'classic',
  weekStart: 'monday',
  weightReminderEnabled: false,
  weightReminderTime: '08:00',
  milestoneReminderEnabled: true,
}

const records = [
  { _id: 'start', weight: 70, recordDate: '2026-06-20', recordedAt: '2026-06-20T07:00:00.000Z', mode: 'now' },
  { _id: 'mon', weight: 69, recordDate: '2026-07-13', recordedAt: '2026-07-13T07:00:00.000Z', mode: 'now' },
  { _id: 'wed', weight: 68.5, recordDate: '2026-07-15', recordedAt: '2026-07-15T07:00:00.000Z', mode: 'now' },
  { _id: 'fri-old', weight: 68.4, recordDate: '2026-07-17', recordedAt: '2026-07-17T06:00:00.000Z', mode: 'now' },
  { _id: 'fri-new', weight: 68.2, recordDate: '2026-07-17', recordedAt: '2026-07-17T08:00:00.000Z', mode: 'note' },
]

test('buildWidgetPanelView maps real records into every widget summary', () => {
  const view = buildWidgetPanelView(records, new Date('2026-07-17T15:00:00+08:00'), settings)

  assert.equal(view.hasRecords, true)
  assert.equal(view.currentWeightLabel, '68.2')
  assert.equal(view.deltaLabel, '1.8')
  assert.equal(view.deltaArrow, '↓')
  assert.equal(view.trackedDays, 28)
  assert.equal(view.latestDateLabel, '7月17日')
  assert.equal(view.weekdays[0].valueLabel, '69.0')
  assert.equal(view.weekdays[1].valueLabel, '--')
  assert.equal(view.weekdays[4].valueLabel, '68.2')
  assert.equal(view.weekdays[4].active, true)
  assert.equal(view.trendSegments.length, 3)
  assert.equal(view.trendPoints.length, 4)
  assert.equal(view.bmiLabel, '23.1')
  assert.equal(view.bmiCategory, '健康')
  assert.match(view.rewardCopy, /1\.7千克/)
})

test('buildWidgetPanelView respects pound units and the configured height', () => {
  const view = buildWidgetPanelView(
    records,
    new Date('2026-07-17T15:00:00+08:00'),
    { ...settings, unit: 'lb', heightCm: 180 },
  )

  assert.equal(view.unitLabel, '磅')
  assert.equal(view.currentWeightLabel, '150.4')
  assert.equal(view.deltaLabel, '4.0')
  assert.equal(view.bmiLabel, '21.0')
  assert.equal(view.bmiCategory, '健康')
})

test('buildWidgetPanelView returns explicit empty values instead of demo data', () => {
  const view = buildWidgetPanelView([], new Date('2026-07-17T15:00:00+08:00'), settings)

  assert.equal(view.hasRecords, false)
  assert.equal(view.currentWeightLabel, '--')
  assert.equal(view.deltaLabel, '--')
  assert.equal(view.latestDateLabel, '暂无记录')
  assert.equal(view.trendPoints.length, 0)
  assert.equal(view.bmiLabel, '--')
  assert.equal(view.rewardTitle, '从第一笔记录开始')
})
