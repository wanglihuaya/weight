import {
  groupLatestDailyRecords,
  serializeRecordDate,
  type CloudWeightRecord,
} from '../../services/weightModels.ts'

export type WeightTrendRange = '7d' | '30d' | '90d'

export interface WeightTrendRangeOption {
  key: WeightTrendRange
  label: string
  days: number
}

export interface WeightTrendPoint {
  key: string
  dateKey: string
  dateLabel: string
  weekdayLabel: string
  value: number
  delta: number
  xRatio: number
}

export interface WeightTrendXTick {
  key: string
  label: string
  xRatio: number
}

export interface WeightTrendChartModel {
  range: WeightTrendRange
  rangeLabel: string
  days: number
  startDateKey: string
  endDateKey: string
  yTicks: number[]
  xTicks: WeightTrendXTick[]
  points: WeightTrendPoint[]
  minPointKey: string
  maxPointKey: string
}

export interface WeightTrendTargetPosition {
  state: 'inside' | 'above' | 'below'
  yRatio: number
}

export const WEIGHT_TREND_RANGES: readonly WeightTrendRangeOption[] = [
  { key: '7d', label: '7天', days: 7 },
  { key: '30d', label: '1月', days: 30 },
  { key: '90d', label: '3月', days: 90 },
]

const DAY_MS = 86400000

function roundTo(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function utcDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function shiftDateKey(referenceDate: Date | number | string, offset: number) {
  const date = new Date(referenceDate)
  date.setDate(date.getDate() + offset)
  return serializeRecordDate(date)
}

function diffDateKeys(startKey: string, endKey: string) {
  return Math.round((utcDay(endKey) - utcDay(startKey)) / DAY_MS)
}

function formatMonthDay(value: string) {
  const date = parseDateKey(value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatShortDate(value: string) {
  const date = parseDateKey(value)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatWeekday(value: string) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[parseDateKey(value).getDay()] ?? ''
}

function niceStep(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0.5
  }

  const exponent = Math.floor(Math.log10(value))
  const magnitude = 10 ** exponent
  const fraction = value / magnitude
  const niceFraction = fraction <= 1
    ? 1
    : fraction <= 2
      ? 2
      : fraction <= 2.5
        ? 2.5
        : fraction <= 5
          ? 5
          : 10
  return niceFraction * magnitude
}

function buildYAxisTicks(values: number[]) {
  if (values.length === 0) {
    return [1.5, 1, 0.5, 0]
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const dataSpan = max - min
  const padding = dataSpan === 0 ? 0.5 : Math.max(0.2, dataSpan * 0.18)
  const paddedMin = Math.max(0, min - padding)
  const paddedMax = max + padding
  const step = niceStep((paddedMax - paddedMin) / 3)
  const axisSpan = step * 3
  const center = (min + max) / 2
  let axisMin = Math.max(0, center - axisSpan / 2)
  let axisMax = axisMin + axisSpan

  if (axisMin > paddedMin) {
    axisMin = paddedMin
    axisMax = axisMin + axisSpan
  }
  if (axisMax < paddedMax) {
    axisMax = paddedMax
    axisMin = Math.max(0, axisMax - axisSpan)
  }

  return new Array(4).fill(null).map((_, index) => (
    roundTo(axisMax - ((axisMax - axisMin) / 3) * index, 2)
  ))
}

function buildXAxisTicks(startDateKey: string, days: number) {
  const startDate = parseDateKey(startDateKey)
  const offsets = new Array(4).fill(null).map((_, index) => (
    Math.round(((days - 1) * index) / 3)
  ))

  return offsets.map((offset) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + offset)
    const key = serializeRecordDate(date)
    return {
      key,
      label: formatShortDate(key),
      xRatio: days === 1 ? 0.5 : offset / (days - 1),
    }
  })
}

export function buildWeightTrendChartModel(
  records: CloudWeightRecord[],
  referenceDate: Date | number | string,
  range: WeightTrendRange,
): WeightTrendChartModel {
  const option = WEIGHT_TREND_RANGES.find(item => item.key === range) ?? WEIGHT_TREND_RANGES[1]
  const days = option.days
  const endDateKey = serializeRecordDate(referenceDate)
  const startDateKey = shiftDateKey(referenceDate, -(days - 1))
  const source = groupLatestDailyRecords(records).filter(record => (
    record.recordDate >= startDateKey && record.recordDate <= endDateKey
  ))
  const spanDays = Math.max(1, days - 1)
  const points = source.map((record, index) => {
    const previous = source[index - 1]
    return {
      key: record._id || record.recordDate,
      dateKey: record.recordDate,
      dateLabel: formatMonthDay(record.recordDate),
      weekdayLabel: formatWeekday(record.recordDate),
      value: roundTo(record.weight, 1),
      delta: previous ? roundTo(record.weight - previous.weight, 1) : 0,
      xRatio: roundTo(diffDateKeys(startDateKey, record.recordDate) / spanDays, 6),
    }
  })
  const minPoint = points.reduce<WeightTrendPoint | null>((current, point) => (
    !current || point.value < current.value ? point : current
  ), null)
  const maxPoint = points.reduce<WeightTrendPoint | null>((current, point) => (
    !current || point.value > current.value ? point : current
  ), null)

  return {
    range: option.key,
    rangeLabel: option.label,
    days,
    startDateKey,
    endDateKey,
    yTicks: buildYAxisTicks(points.map(point => point.value)),
    xTicks: buildXAxisTicks(startDateKey, days),
    points,
    minPointKey: minPoint?.key ?? '',
    maxPointKey: maxPoint?.key ?? '',
  }
}

export function resolveNearestTrendPoint(points: WeightTrendPoint[], xRatio: number) {
  if (points.length === 0) {
    return -1
  }

  const safeRatio = Math.min(1, Math.max(0, xRatio))
  let nearestIndex = 0
  let nearestDistance = Math.abs(points[0].xRatio - safeRatio)

  for (let index = 1; index < points.length; index += 1) {
    const distance = Math.abs(points[index].xRatio - safeRatio)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  }

  return nearestIndex
}

export function resolveWeightTrendTargetPosition(
  targetWeight: number,
  yTicks: number[],
): WeightTrendTargetPosition | null {
  if (!Number.isFinite(targetWeight) || yTicks.length < 2) {
    return null
  }

  const yMax = yTicks[0]
  const yMin = yTicks.at(-1) ?? yMax
  if (targetWeight > yMax) {
    return { state: 'above', yRatio: 0 }
  }
  if (targetWeight < yMin) {
    return { state: 'below', yRatio: 1 }
  }

  return {
    state: 'inside',
    yRatio: (yMax - targetWeight) / Math.max(0.1, yMax - yMin),
  }
}
