import assert from 'node:assert/strict'
import test from 'node:test'

import weightRecordModel from '../../cloudfunctions/weight-records/model.js'

const records = [
  { _id: '1', weight: 70, recordDate: '2026-07-01', recordedAt: '2026-07-01T08:00:00.000Z' },
  { _id: '2', weight: 70.5, recordDate: '2026-07-15', recordedAt: '2026-07-15T08:00:00.000Z' },
  { _id: '3', weight: 70.7, recordDate: '2026-07-15', recordedAt: '2026-07-15T12:00:00.000Z' },
  { _id: '4', weight: 70.8, recordDate: '2026-07-16', recordedAt: '2026-07-16T08:00:00.000Z' },
  { _id: '5', weight: 71, recordDate: '2026-07-17', recordedAt: '2026-07-17T08:00:00.000Z' },
]

test('buildSummary uses the latest record per day', () => {
  const summary = weightRecordModel.buildSummary(records, '2026-07-17')

  assert.equal(summary.streakDays, 3)
  assert.equal(summary.weeklyDelta, 0.3)
  assert.equal(summary.monthlyAverage, 70.6)
  assert.equal(summary.monthlyDelta, 1)
  assert.equal(summary.monthlyRecordedDays, 4)
  assert.equal(summary.monthlyCompletionRate, 24)
  assert.equal(summary.recentLow, 70)
  assert.equal(summary.recentHigh, 71)
  assert.equal(summary.totalRecordedDays, 4)
  assert.equal(summary.latestRecordedAt, '2026-07-17T08:00:00.000Z')
})

test('resolveRecordDate rejects calendar dates that do not exist', () => {
  assert.throws(
    () => weightRecordModel.resolveRecordDate('2026-02-30'),
    /INVALID_RECORD_DATE/,
  )
})
