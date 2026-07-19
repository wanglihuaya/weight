import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildWeightTrendChartModel,
  resolveNearestTrendPoint,
  resolveWeightTrendTargetPosition,
} from './weightTrend.ts'

function record(id, weight, recordDate, hour = 8) {
  return {
    _id: id,
    weight,
    recordDate,
    recordedAt: `${recordDate}T${String(hour).padStart(2, '0')}:00:00.000Z`,
    mode: 'now',
  }
}

test('buildWeightTrendChartModel filters the selected inclusive calendar window', () => {
  const records = [
    record('outside', 70, '2026-07-12'),
    record('start', 69.8, '2026-07-13'),
    record('today', 69.2, '2026-07-19'),
  ]
  const model = buildWeightTrendChartModel(records, new Date('2026-07-19T12:00:00+08:00'), '7d')

  assert.equal(model.startDateKey, '2026-07-13')
  assert.equal(model.endDateKey, '2026-07-19')
  assert.deepEqual(model.points.map(point => point.key), ['start', 'today'])
})

test('buildWeightTrendChartModel keeps the latest same-day record and real date spacing', () => {
  const records = [
    record('day-1', 70, '2026-07-13'),
    record('day-3-old', 69.8, '2026-07-15', 7),
    record('day-3-latest', 69.6, '2026-07-15', 20),
    record('day-7', 69.2, '2026-07-19'),
  ]
  const model = buildWeightTrendChartModel(records, new Date('2026-07-19T12:00:00+08:00'), '7d')

  assert.deepEqual(model.points.map(point => point.key), ['day-1', 'day-3-latest', 'day-7'])
  assert.deepEqual(model.points.map(point => point.xRatio), [0, 0.333333, 1])
  assert.equal(model.points[1].delta, -0.4)
})

test('buildWeightTrendChartModel returns four ticks and visible space for equal values', () => {
  const model = buildWeightTrendChartModel([
    record('one', 70, '2026-07-18'),
    record('two', 70, '2026-07-19'),
  ], new Date('2026-07-19T12:00:00+08:00'), '30d')

  assert.equal(model.yTicks.length, 4)
  assert.ok(model.yTicks[0] > 70)
  assert.ok(model.yTicks.at(-1) < 70)
  assert.equal(model.minPointKey, 'one')
  assert.equal(model.maxPointKey, 'one')
})

test('buildWeightTrendChartModel supports an empty 90-day range', () => {
  const model = buildWeightTrendChartModel([], new Date('2026-07-19T12:00:00+08:00'), '90d')

  assert.equal(model.days, 90)
  assert.equal(model.points.length, 0)
  assert.equal(model.xTicks.length, 4)
  assert.equal(model.yTicks.length, 4)
})

test('buildWeightTrendChartModel keeps all daily points in a complete 90-day range', () => {
  const start = new Date(2026, 3, 21)
  const records = new Array(90).fill(null).map((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    return record(`day-${index + 1}`, 70 - index * 0.02, dateKey)
  })
  const model = buildWeightTrendChartModel(records, new Date('2026-07-19T12:00:00+08:00'), '90d')

  assert.equal(model.points.length, 90)
  assert.equal(model.points[0].xRatio, 0)
  assert.equal(model.points.at(-1).xRatio, 1)
})

test('buildWeightTrendChartModel renders a single record without inventing a delta', () => {
  const model = buildWeightTrendChartModel([
    record('only', 68.4, '2026-07-19'),
  ], new Date('2026-07-19T12:00:00+08:00'), '30d')

  assert.equal(model.points.length, 1)
  assert.equal(model.points[0].xRatio, 1)
  assert.equal(model.points[0].delta, 0)
})

test('resolveNearestTrendPoint selects the nearest real date position', () => {
  const model = buildWeightTrendChartModel([
    record('start', 70, '2026-07-13'),
    record('middle', 69.5, '2026-07-16'),
    record('end', 69, '2026-07-19'),
  ], new Date('2026-07-19T12:00:00+08:00'), '7d')

  assert.equal(resolveNearestTrendPoint(model.points, 0.1), 0)
  assert.equal(resolveNearestTrendPoint(model.points, 0.6), 1)
  assert.equal(resolveNearestTrendPoint(model.points, 0.95), 2)
  assert.equal(resolveNearestTrendPoint([], 0.5), -1)
})

test('resolveWeightTrendTargetPosition reports inside and off-axis targets', () => {
  const ticks = [72, 71, 70, 69]

  assert.deepEqual(resolveWeightTrendTargetPosition(70.5, ticks), {
    state: 'inside',
    yRatio: 0.5,
  })
  assert.deepEqual(resolveWeightTrendTargetPosition(73, ticks), {
    state: 'above',
    yRatio: 0,
  })
  assert.deepEqual(resolveWeightTrendTargetPosition(68, ticks), {
    state: 'below',
    yRatio: 1,
  })
})
