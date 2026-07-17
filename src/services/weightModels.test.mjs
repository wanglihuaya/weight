import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildMonthlyRecordsView,
  buildWeightDashboardView,
  groupLatestDailyRecords,
} from './weightModels.ts'

const sampleRecords = [
  { _id: 'r1', weight: 69.9, recordDate: '2026-03-30', recordedAt: '2026-03-30T07:30:00.000Z', mode: 'now' },
  { _id: 'r2', weight: 70.2, recordDate: '2026-04-06', recordedAt: '2026-04-06T07:30:00.000Z', mode: 'now' },
  { _id: 'r3', weight: 70.5, recordDate: '2026-04-13', recordedAt: '2026-04-13T07:30:00.000Z', mode: 'now' },
  { _id: 'r4', weight: 70.8, recordDate: '2026-04-21', recordedAt: '2026-04-21T07:30:00.000Z', mode: 'now' },
  { _id: 'r5', weight: 71.0, recordDate: '2026-04-24', recordedAt: '2026-04-24T07:30:00.000Z', mode: 'note', note: '晨起空腹' },
  { _id: 'r6', weight: 71.1, recordDate: '2026-04-26', recordedAt: '2026-04-26T07:30:00.000Z', mode: 'now' },
  { _id: 'r7', weight: 71.3, recordDate: '2026-04-26', recordedAt: '2026-04-26T13:30:00.000Z', mode: 'photo' },
]

test('groupLatestDailyRecords keeps only the latest entry per day', () => {
  const grouped = groupLatestDailyRecords(sampleRecords)

  assert.equal(grouped.length, 6)
  assert.equal(grouped.at(-1)?._id, 'r7')
  assert.equal(grouped.at(-1)?.weight, 71.3)
  assert.deepEqual(grouped.map(record => record.recordDate), [
    '2026-03-30',
    '2026-04-06',
    '2026-04-13',
    '2026-04-21',
    '2026-04-24',
    '2026-04-26',
  ])
})

test('buildWeightDashboardView derives the home page summary from cloud records', () => {
  const view = buildWeightDashboardView(sampleRecords, new Date('2026-04-26T20:00:00+08:00'))

  assert.equal(view.summary.startLabel, '3月30日')
  assert.equal(view.summary.startWeight, 69.9)
  assert.equal(view.summary.totalDays, 28)
  assert.equal(view.summary.deltaFromStart, 1.4)
  assert.equal(view.summary.recent.current, 71.3)
  assert.deepEqual(view.summary.weekCheckIn, [false, true, false, false, true, false, true])
  assert.equal(view.todayRecord?.value, 71.3)
  assert.equal(view.todayRecord?.dateText, '4月26日 周日')
  assert.equal(view.recentRecords[0]?.note, '照片记录')
  assert.equal(view.chart.points.length, 5)
  assert.deepEqual(view.chart.xLabels, ['3月30日', '4月6日', '4月13日', '4月21日'])
})

test('buildWeightDashboardView exposes richer stats for the weight tab overview', () => {
  const streakRecords = [
    { _id: 'a1', weight: 69.9, recordDate: '2026-04-02', recordedAt: '2026-04-02T07:30:00.000Z', mode: 'now' },
    { _id: 'a2', weight: 70.4, recordDate: '2026-04-20', recordedAt: '2026-04-20T07:30:00.000Z', mode: 'now' },
    { _id: 'a3', weight: 70.8, recordDate: '2026-04-21', recordedAt: '2026-04-21T07:30:00.000Z', mode: 'now' },
    { _id: 'a4', weight: 71.0, recordDate: '2026-04-24', recordedAt: '2026-04-24T07:30:00.000Z', mode: 'now' },
    { _id: 'a5', weight: 70.9, recordDate: '2026-04-25', recordedAt: '2026-04-25T07:30:00.000Z', mode: 'now' },
    { _id: 'a6', weight: 71.3, recordDate: '2026-04-26', recordedAt: '2026-04-26T07:30:00.000Z', mode: 'photo' },
  ]
  const view = buildWeightDashboardView(streakRecords, new Date('2026-04-26T20:00:00+08:00'))

  assert.equal(view.stats.streakDays, 3)
  assert.equal(view.stats.weeklyDelta, 0.9)
  assert.equal(view.stats.monthlyAverage, 70.7)
  assert.equal(view.stats.monthlyRecordedDays, 6)
  assert.equal(view.stats.monthlyCompletionRate, 23)
  assert.equal(view.stats.recentLow, 69.9)
  assert.equal(view.stats.recentHigh, 71.3)
  assert.equal(view.stats.totalRecordedDays, 6)
})

test('buildMonthlyRecordsView builds the calendar and weekly summaries from records', () => {
  const view = buildMonthlyRecordsView(sampleRecords, new Date('2026-04-01T00:00:00+08:00'), new Date('2026-04-26T20:00:00+08:00'))

  assert.equal(view.monthLabel, '2026年4月')
  assert.equal(view.monthAverageLabel, '70.8')
  assert.equal(view.weightChangeLabel, '1.1')
  assert.equal(view.stats.recordedDays, 5)
  assert.equal(view.stats.completionRate, 19)
  assert.equal(view.stats.lowestWeightLabel, '70.2')
  assert.equal(view.stats.highestWeightLabel, '71.3')
  assert.equal(view.days[22].label, '21')
  assert.equal(view.days[22].isRecorded, true)
  assert.equal(view.days[27].label, '26')
  assert.equal(view.days[27].isRecorded, true)
  assert.equal(view.days[27].isToday, true)
  assert.equal(view.weekGroups[3]?.summaryText, '3次记录 · 均重71.0千克')
  assert.equal(view.weekGroups[1]?.recordCount, 1)
  assert.equal(view.weekGroups[1]?.averageWeightLabel, '70.2')
  assert.equal(view.weekGroups[1]?.rangeLabel, '70.2 - 70.2')
  assert.equal(view.weekGroups[3]?.latestWeightLabel, '71.3')
  assert.equal(view.weekGroups[3]?.deltaLabel, '+0.5')
  assert.equal(view.weekGroups[4]?.summaryText, '无')
})

test('buildMonthlyRecordsView accepts a timestamp month source from reactive state', () => {
  const monthTimestamp = new Date('2026-04-01T00:00:00+08:00').getTime()
  const view = buildMonthlyRecordsView(
    sampleRecords,
    monthTimestamp,
    new Date('2026-04-26T20:00:00+08:00'),
  )

  assert.equal(view.monthLabel, '2026年4月')
  assert.equal(view.days[27].label, '26')
})
