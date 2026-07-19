import type { UserSettings } from '../../services/settingsApi.ts'
import {
  groupLatestDailyRecords,
  serializeRecordDate,
  type CloudWeightRecord,
} from '../../services/weightModels.ts'

export interface WidgetWeekDay {
  key: string
  label: string
  valueLabel: string
  tone: 'blue' | 'coral' | 'muted'
  position: number | null
  hasRecord: boolean
  active: boolean
}

export interface WidgetTrendSegment {
  key: string
  style: string
}

export interface WidgetTrendPoint {
  key: string
  style: string
}

export interface WidgetPanelView {
  hasRecords: boolean
  unitLabel: string
  currentWeightLabel: string
  latestDateLabel: string
  latestMonthLabel: string
  latestDayLabel: string
  primaryLabel: string
  deltaLabel: string
  deltaIcon: 'i-lucide-arrow-down' | 'i-lucide-arrow-up' | 'i-lucide-arrow-right'
  deltaTone: 'down' | 'up' | 'flat'
  trackedDays: number
  streakDays: number
  gaugeMinLabel: string
  gaugeMaxLabel: string
  gaugeMarkerStyle: string
  weekdays: WidgetWeekDay[]
  trendSegments: WidgetTrendSegment[]
  trendPoints: WidgetTrendPoint[]
  trendStartLabel: string
  trendEndLabel: string
  bmiLabel: string
  bmiCategory: string
  bmiHint: string
  bmiMarkerStyle: string
  rewardTitle: string
  rewardCopy: string
}

const KG_TO_LB = 2.2046226218
const DAY_MS = 86400000

function parseRecordDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(value: Date | number | string) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatMonthDay(value: string) {
  const date = parseRecordDate(value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function roundTo(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function resolveUnit(settings: UserSettings) {
  return {
    factor: settings.unit === 'lb' ? KG_TO_LB : 1,
    label: settings.unit === 'lb' ? '磅' : '千克',
  }
}

function formatWeight(value: number, factor: number) {
  return (value * factor).toFixed(1)
}

function buildWeekdays(
  records: CloudWeightRecord[],
  referenceDate: Date,
  settings: UserSettings,
  factor: number,
): WidgetWeekDay[] {
  const current = startOfDay(referenceDate)
  const day = current.getDay()
  const startOffset = settings.weekStart === 'sunday' ? day : day === 0 ? 6 : day - 1
  const weekStart = new Date(current)
  weekStart.setDate(current.getDate() - startOffset)

  const dates = new Array(7).fill(null).map((_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return date
  })
  const recordsByDate = new Map(records.map(record => [record.recordDate, record]))
  const weekRecords = dates
    .map(date => recordsByDate.get(serializeRecordDate(date)))
    .filter((record): record is CloudWeightRecord => !!record)
  const weekValues = weekRecords.map(record => record.weight)
  const weekMin = weekValues.length > 0 ? Math.min(...weekValues) : 0
  const weekMax = weekValues.length > 0 ? Math.max(...weekValues) : 0
  const weekRange = weekMax - weekMin
  let previousRecord: CloudWeightRecord | undefined

  return dates.map((date) => {
    const dateKey = serializeRecordDate(date)
    const record = recordsByDate.get(dateKey)
    const weekdayLabel = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
    let tone: WidgetWeekDay['tone'] = 'muted'
    let position: number | null = null

    if (record) {
      tone = previousRecord && record.weight > previousRecord.weight ? 'coral' : 'blue'
      position = weekRange <= 0
        ? 50
        : roundTo(25 + ((weekMax - record.weight) / weekRange) * 50, 2)
      previousRecord = record
    }

    return {
      key: dateKey,
      label: weekdayLabel,
      valueLabel: record ? formatWeight(record.weight, factor) : '--',
      tone,
      position,
      hasRecord: !!record,
      active: dateKey === serializeRecordDate(current),
    }
  })
}

function buildTrend(
  records: CloudWeightRecord[],
  referenceDate: Date,
): {
  segments: WidgetTrendSegment[]
  points: WidgetTrendPoint[]
  startLabel: string
  endLabel: string
} {
  const startDate = new Date(referenceDate)
  startDate.setDate(startDate.getDate() - 29)
  const startKey = serializeRecordDate(startDate)
  const source = records.filter(record => record.recordDate >= startKey).slice(-12)

  if (source.length === 0) {
    return {
      segments: [],
      points: [],
      startLabel: '--',
      endLabel: '--',
    }
  }

  const values = source.map(record => record.weight)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(0.5, max - min)
  const points = source.map((record, index) => {
    const x = source.length === 1 ? 127 : (254 / (source.length - 1)) * index
    const y = 16 + ((max - record.weight) / range) * 116
    return {
      key: record._id || record.recordDate,
      x,
      y,
    }
  })

  return {
    segments: points.slice(0, -1).map((point, index) => {
      const next = points[index + 1]
      const deltaX = next.x - point.x
      const deltaY = next.y - point.y
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
      return {
        key: `segment-${point.key}-${next.key}`,
        style: `left:${point.x}rpx;top:${point.y}rpx;width:${length}rpx;transform:rotate(${angle}deg);`,
      }
    }),
    points: points.map(point => ({
      key: `point-${point.key}`,
      style: `left:${point.x}rpx;top:${point.y}rpx;`,
    })),
    startLabel: formatMonthDay(source[0].recordDate),
    endLabel: formatMonthDay(source.at(-1)!.recordDate),
  }
}

function resolveStreakDays(records: CloudWeightRecord[], referenceDate: Date) {
  const recordDates = new Set(records.map(record => record.recordDate))
  const cursor = startOfDay(referenceDate)
  const todayKey = serializeRecordDate(cursor)
  if (!recordDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (recordDates.has(serializeRecordDate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function resolveBmi(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) {
    return {
      label: '--',
      category: '未计算',
      hint: '记录体重后生成 BMI',
      markerStyle: 'left:0%;',
    }
  }

  const heightM = heightCm / 100
  const bmi = roundTo(weightKg / (heightM * heightM), 1)
  const category = bmi < 18.5 ? '偏轻' : bmi < 24 ? '健康' : bmi < 28 ? '超重' : '肥胖'
  const hint = bmi < 18.5
    ? '建议关注营养与力量训练'
    : bmi < 24
      ? '处于健康体重范围'
      : bmi < 28
        ? '建议关注近期趋势'
        : '建议制定稳健减重计划'

  return {
    label: bmi.toFixed(1),
    category,
    hint,
    markerStyle: `left:${clamp(((bmi - 15) / 20) * 100, 0, 100)}%;`,
  }
}

export function buildWidgetPanelView(
  records: CloudWeightRecord[],
  referenceDate: Date | number | string,
  settings: UserSettings,
): WidgetPanelView {
  const safeReferenceDate = new Date(referenceDate)
  const dailyRecords = groupLatestDailyRecords(records)
  const currentRecord = dailyRecords.at(-1)
  const firstRecord = dailyRecords[0]
  const { factor, label: unitLabel } = resolveUnit(settings)
  const weekdays = buildWeekdays(dailyRecords, safeReferenceDate, settings, factor)
  const trend = buildTrend(dailyRecords, safeReferenceDate)
  const currentWeight = currentRecord?.weight ?? 0
  const delta = currentRecord && firstRecord ? roundTo(currentRecord.weight - firstRecord.weight) : 0
  const deltaTone = delta < 0 ? 'down' : delta > 0 ? 'up' : 'flat'
  const trackedDays = firstRecord
    ? Math.max(1, Math.floor((startOfDay(safeReferenceDate).getTime() - parseRecordDate(firstRecord.recordDate).getTime()) / DAY_MS) + 1)
    : 0
  const recentRecords = dailyRecords.slice(-30)
  const recentValues = recentRecords.map(record => record.weight)
  const recentMin = recentValues.length > 0 ? Math.min(...recentValues) : 0
  const recentMax = recentValues.length > 0 ? Math.max(...recentValues) : 0
  const gaugeRange = Math.max(0.5, recentMax - recentMin)
  const gaugeMin = recentValues.length > 0 ? recentMin - (recentMax === recentMin ? 0.5 : 0) : 0
  const gaugeMax = recentValues.length > 0 ? recentMax + (recentMax === recentMin ? 0.5 : 0) : 0
  const gaugePosition = currentRecord
    ? clamp(((currentRecord.weight - gaugeMin) / Math.max(0.5, gaugeMax - gaugeMin || gaugeRange)) * 100, 0, 100)
    : 0
  const bmi = resolveBmi(currentWeight, settings.heightCm)
  const targetDistanceKg = currentRecord ? roundTo(currentRecord.weight - settings.targetWeight) : 0
  const targetLabel = formatWeight(settings.targetWeight, factor)
  const latestDate = currentRecord ? parseRecordDate(currentRecord.recordDate) : safeReferenceDate
  const hasReachedTarget = !!currentRecord && targetDistanceKg <= 0

  return {
    hasRecords: !!currentRecord,
    unitLabel,
    currentWeightLabel: currentRecord ? formatWeight(currentRecord.weight, factor) : '--',
    latestDateLabel: currentRecord ? formatMonthDay(currentRecord.recordDate) : '暂无记录',
    latestMonthLabel: `${latestDate.getMonth() + 1}月`,
    latestDayLabel: currentRecord ? `${latestDate.getDate()}` : '--',
    primaryLabel: currentRecord?.recordDate === serializeRecordDate(safeReferenceDate) ? '今天' : '最新',
    deltaLabel: currentRecord ? formatWeight(Math.abs(delta), factor) : '--',
    deltaIcon: delta < 0 ? 'i-lucide-arrow-down' : delta > 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-right',
    deltaTone,
    trackedDays,
    streakDays: resolveStreakDays(dailyRecords, safeReferenceDate),
    gaugeMinLabel: currentRecord ? formatWeight(gaugeMin, factor) : '--',
    gaugeMaxLabel: currentRecord ? formatWeight(gaugeMax, factor) : '--',
    gaugeMarkerStyle: `left:${gaugePosition}%;`,
    weekdays,
    trendSegments: trend.segments,
    trendPoints: trend.points,
    trendStartLabel: trend.startLabel,
    trendEndLabel: trend.endLabel,
    bmiLabel: bmi.label,
    bmiCategory: bmi.category,
    bmiHint: bmi.hint,
    bmiMarkerStyle: bmi.markerStyle,
    rewardTitle: !currentRecord
      ? '从第一笔记录开始'
      : hasReachedTarget
        ? '目标已达成'
        : `已追踪 ${trackedDays} 天`,
    rewardCopy: !currentRecord
      ? '记录体重后，这里会展示目标进度'
      : hasReachedTarget
        ? `当前体重已达到 ${targetLabel}${unitLabel} 目标`
        : `距离 ${targetLabel}${unitLabel} 目标还差 ${formatWeight(targetDistanceKg, factor)}${unitLabel}`,
  }
}
